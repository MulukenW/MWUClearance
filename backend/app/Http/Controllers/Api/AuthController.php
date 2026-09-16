<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Notifications\PasswordResetNotification;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user and create token
     *
     * @param LoginRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(LoginRequest $request)
    {
        try {
            // Find user by email
            $user = User::where('email', $request->email)->first();

            // Check if user exists and password is correct
            if (!$user || !Hash::check($request->password, $user->password)) {
                // Log failed login attempt
                AuditLogService::logAuth('failed_login', null, $request->email);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials',
                ], 401);
            }

            // Check if user is active
            if ($user->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is not active. Please contact the administrator.',
                ], 403);
            }

            // Check if user has a role
            if (!$user->role) {
                return response()->json([
                    'success' => false,
                    'message' => 'No role assigned to your account. Please contact the administrator.',
                ], 403);
            }

            // Delete old tokens (optional - keeps only one active session)
            // $user->tokens()->delete();

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Log successful login
            AuditLogService::logAuth('login', $user->id, $user->email);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => new UserResource($user),
                    'token' => $token,
                    'token_type' => 'Bearer',
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during login',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Logout user (revoke token)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            // Log logout
            AuditLogService::logAuth('logout', $user->id, $user->email);

            // Revoke current token
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during logout',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get current authenticated user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();

            // Load relationships
            $user->load([
                'role.permissions',
                'department.college',
                'clearanceOffice',
                'student.studentType',
                'student.department.college',
                'student.college',
                'student.program',
            ]);

            return response()->json([
                'success' => true,
                'data' => new UserResource($user),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Refresh user data (re-fetch current user)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh(Request $request)
    {
        return $this->me($request);
    }

    /**
     * Check if user has specific permission
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkPermission(Request $request)
    {
        $request->validate([
            'permission' => 'required|string',
        ]);

        $user = $request->user();
        $hasPermission = $user->hasPermission($request->permission);

        return response()->json([
            'success' => true,
            'data' => [
                'has_permission' => $hasPermission,
                'permission' => $request->permission,
            ],
        ], 200);
    }

    /**
     * Revoke all tokens (logout from all devices)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logoutAll(Request $request)
    {
        try {
            $user = $request->user();

            // Log logout from all devices
            AuditLogService::log(
                'logout_all',
                'User logged out from all devices',
                'App\Models\User',
                $user->id
            );

            // Revoke all tokens
            $user->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out from all devices successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Request a password reset token.
     * In production, the token would be sent via email.
     * For API development, it is returned in the response.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Return success even if user not found (security best practice)
            return response()->json([
                'success' => true,
                'message' => 'If your email is registered, you will receive a password reset token.',
            ], 200);
        }

        // Delete any existing reset tokens for this email
        DB::table('password_resets')->where('email', $request->email)->delete();

        // Generate reset token
        $token = Str::random(64);

        // Store token in password_resets table
        DB::table('password_resets')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        AuditLogService::log(
            'password_reset_requested',
            "Password reset requested for: {$request->email}",
            'App\Models\User',
            $user->id
        );

        $user->notify(new PasswordResetNotification($token));

        return response()->json([
            'success' => true,
            'message' => 'If your email is registered, a password reset link has been sent.',
            'data' => config('app.debug') ? [
                'reset_token' => $token,
                'note' => 'In production, this token would be sent to the registered email address.',
            ] : null,
        ], 200);
    }

    /**
     * Reset password using token.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $resetRecord = DB::table('password_resets')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid reset request.',
            ], 400);
        }

        // Check token expiration (1 hour)
        $tokenCreatedAt = \Carbon\Carbon::parse($resetRecord->created_at);
        if ($tokenCreatedAt->addHour()->isPast()) {
            DB::table('password_resets')->where('email', $request->email)->delete();
            return response()->json([
                'success' => false,
                'message' => 'Reset token has expired. Please request a new one.',
            ], 400);
        }

        // Verify token
        if (!Hash::check($request->token, $resetRecord->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid reset token.',
            ], 400);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Delete used token
        DB::table('password_resets')->where('email', $request->email)->delete();

        // Revoke all existing tokens (force re-login)
        $user->tokens()->delete();

        AuditLogService::logAuth('password_reset', $user->id, $user->email);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. Please login with your new password.',
        ], 200);
    }

    /**
     * Change password for authenticated user.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 400);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        AuditLogService::log(
            'password_changed',
            'Password changed',
            'App\Models\User',
            $user->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ], 200);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        // Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $user = $request->user();

        // Check if user has a role
        if (!$user->role) {
            return response()->json([
                'success' => false,
                'message' => 'No role assigned to your account',
            ], 403);
        }

        // Check if user's role matches any of the required roles
        $userRole = $user->role->code;
        
        if (!in_array($userRole, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not have permission to perform this action.',
                'required_roles' => $roles,
                'your_role' => $userRole,
            ], 403);
        }

        return $next($request);
    }
}

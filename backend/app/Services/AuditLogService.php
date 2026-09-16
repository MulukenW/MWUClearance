<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    /**
     * Log an action to the audit trail
     *
     * @param string $action
     * @param string $description
     * @param string|null $modelType
     * @param int|null $modelId
     * @param array|null $metadata
     * @return AuditLog
     */
    public static function log(
        string $action,
        string $description,
        ?string $modelType = null,
        ?int $modelId = null,
        ?array $metadata = null
    ): AuditLog {
        return AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'description' => $description,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'metadata' => $metadata ? json_encode($metadata) : null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Log authentication action
     *
     * @param string $action (login, logout, failed_login)
     * @param int|null $userId
     * @param string|null $email
     * @return AuditLog
     */
    public static function logAuth(string $action, ?int $userId = null, ?string $email = null): AuditLog
    {
        // PHP 7.4 compatible switch instead of match
        switch($action) {
            case 'login':
                $description = 'User logged in successfully';
                break;
            case 'logout':
                $description = 'User logged out';
                break;
            case 'failed_login':
                $description = "Failed login attempt for email: {$email}";
                break;
            default:
                $description = "Authentication action: {$action}";
                break;
        }

        return AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'model_type' => 'App\Models\User',
            'model_id' => $userId,
            'metadata' => json_encode(['email' => $email]),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Log clearance action
     *
     * @param string $action
     * @param int $clearanceItemId
     * @param string $description
     * @param array|null $metadata
     * @return AuditLog
     */
    public static function logClearance(
        string $action,
        int $clearanceItemId,
        string $description,
        ?array $metadata = null
    ): AuditLog {
        return self::log(
            $action,
            $description,
            'App\Models\ClearanceItem',
            $clearanceItemId,
            $metadata
        );
    }

    /**
     * Get audit logs for a specific user
     *
     * @param int $userId
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getUserLogs(int $userId, int $limit = 50)
    {
        return AuditLog::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get audit logs for a specific model
     *
     * @param string $modelType
     * @param int $modelId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getModelLogs(string $modelType, int $modelId)
    {
        return AuditLog::where('model_type', $modelType)
            ->where('model_id', $modelId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}

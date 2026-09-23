<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\ClearanceRequest;
use App\Models\ClearanceItem;

class NotificationService
{
    /**
     * Create a notification for a user
     * 
     * @param int $userId
     * @param string $type
     * @param string $title
     * @param string $message
     * @param array|null $metadata
     * @return Notification
     */
    public static function create(int $userId, string $type, string $title, string $message, ?array $metadata = null): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'metadata' => $metadata ? json_encode($metadata) : null,
            'is_read' => false,
        ]);
    }
    
    /**
     * Notify student about clearance submission
     * 
     * @param ClearanceRequest $clearanceRequest
     */
    public static function notifyClearanceSubmitted(ClearanceRequest $clearanceRequest): void
    {
        $student = $clearanceRequest->student;
        
        self::create(
            $student->user_id,
            'clearance_submitted',
            'Clearance Request Submitted',
            "Your clearance request ({$clearanceRequest->clearance_number}) has been submitted successfully.",
            [
                'clearance_request_id' => $clearanceRequest->id,
                'clearance_number' => $clearanceRequest->clearance_number,
            ]
        );
    }
    
    /**
     * Notify student when clearance item is approved
     * 
     * @param ClearanceItem $clearanceItem
     */
    public static function notifyClearanceApproved(ClearanceItem $clearanceItem): void
    {
        $student = $clearanceItem->clearanceRequest->student;
        $office = $clearanceItem->clearanceOffice;
        
        self::create(
            $student->user_id,
            'clearance_approved',
            'Clearance Step Approved',
            "Your clearance has been approved by {$office->name}.",
            [
                'clearance_item_id' => $clearanceItem->id,
                'clearance_office' => $office->name,
                'clearance_request_id' => $clearanceItem->clearance_request_id,
            ]
        );
    }
    
    /**
     * Notify student when clearance item is rejected
     * 
     * @param ClearanceItem $clearanceItem
     */
    public static function notifyClearanceRejected(ClearanceItem $clearanceItem): void
    {
        $student = $clearanceItem->clearanceRequest->student;
        $office = $clearanceItem->clearanceOffice;
        
        self::create(
            $student->user_id,
            'clearance_rejected',
            'Clearance Step Rejected',
            "Your clearance has been rejected by {$office->name}. Reason: {$clearanceItem->rejection_reason}",
            [
                'clearance_item_id' => $clearanceItem->id,
                'clearance_office' => $office->name,
                'reason' => $clearanceItem->rejection_reason,
                'clearance_request_id' => $clearanceItem->clearance_request_id,
            ]
        );
    }
    
    /**
     * Notify officer when new clearance item is ready for review
     * 
     * @param ClearanceItem $clearanceItem
     */
    public static function notifyOfficerNewClearance(ClearanceItem $clearanceItem): void
    {
        $student = $clearanceItem->clearanceRequest->student;
        $office = $clearanceItem->clearanceOffice;
        
        // Find users assigned to this clearance office who are scoped to
        // this student (department- or college-level officers).
        $users = User::where('clearance_office_id', $office->id)
            ->where('status', 'active')
            ->get()
            ->filter(function ($user) use ($student) {
                if ($user->department_id) {
                    return $student->department_id === $user->department_id;
                }
                if ($user->college_id) {
                    return $student->department && $student->department->college_id === $user->college_id;
                }
                return true; // unscoped officer — sees everyone
            });
        
        foreach ($users as $user) {
            self::create(
                $user->id,
                'new_clearance_item',
                'New Clearance for Review',
                "A new clearance request from {$student->full_name} ({$student->student_id}) is ready for your review.",
                [
                    'clearance_item_id' => $clearanceItem->id,
                    'student_id' => $student->id,
                    'student_name' => $student->full_name,
                    'clearance_request_id' => $clearanceItem->clearance_request_id,
                ]
            );
        }
    }

    /**
     * Notify the student when a clearance step is ready for review.
     *
     * @param ClearanceItem $clearanceItem
     */
    public static function notifyClearanceUnderReview(ClearanceItem $clearanceItem): void
    {
        $student = $clearanceItem->clearanceRequest->student;
        $office = $clearanceItem->clearanceOffice;

        self::create(
            $student->user_id,
            'clearance_under_review',
            'Clearance Under Review',
            "Your clearance is under review by {$office->name}.",
            [
                'clearance_item_id' => $clearanceItem->id,
                'clearance_office' => $office->name,
                'clearance_request_id' => $clearanceItem->clearance_request_id,
            ]
        );
    }
    
    /**
     * Notify student when final clearance is completed
     * 
     * @param ClearanceRequest $clearanceRequest
     */
    public static function notifyFinalClearanceCompleted(ClearanceRequest $clearanceRequest): void
    {
        $student = $clearanceRequest->student;
        
        self::create(
            $student->user_id,
            'final_clearance_completed',
            'Clearance Completed',
            "Congratulations! Your clearance request ({$clearanceRequest->clearance_number}) has been completed. You can now download your clearance certificate.",
            [
                'clearance_request_id' => $clearanceRequest->id,
                'clearance_number' => $clearanceRequest->clearance_number,
                'certificate_id' => $clearanceRequest->certificate->id ?? null,
            ]
        );
    }
    
    /**
     * Mark notification as read
     * 
     * @param int $notificationId
     * @return bool
     */
    public static function markAsRead(int $notificationId): bool
    {
        $notification = Notification::find($notificationId);
        
        if ($notification) {
            $notification->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
            return true;
        }
        
        return false;
    }
    
    /**
     * Mark all notifications as read for a user
     * 
     * @param int $userId
     * @return int Number of notifications marked as read
     */
    public static function markAllAsRead(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }
    
    /**
     * Get unread notification count for a user
     * 
     * @param int $userId
     * @return int
     */
    public static function getUnreadCount(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }
}

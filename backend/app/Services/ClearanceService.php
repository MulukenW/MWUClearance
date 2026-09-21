<?php

namespace App\Services;

use App\Models\ClearanceRequest;
use App\Models\ClearanceItem;
use App\Models\ClearanceAction;
use App\Models\ClearanceWorkflowStep;
use App\Models\Student;
use App\Models\Certificate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

class ClearanceService
{
    /**
     * Create a new clearance request for a student
     * 
     * @param int $studentId
     * @param string|null $purpose
     * @param string|null $programType
     * @param string|null $reasonForClearance
     * @param string|null $reasonOther
     * @param string|null $policeLocation
     * @return ClearanceRequest
     * @throws Exception
     */
    public function createClearanceRequest(
        int $studentId, 
        ?string $purpose = null,
        ?string $programType = null,
        ?string $reasonForClearance = null,
        ?string $reasonOther = null,
        ?string $policeLocation = null
    ): ClearanceRequest
    {
        DB::beginTransaction();
        
        try {
            $student = Student::with('studentType')->findOrFail($studentId);
            
            // Get student's academic year (semester)
            $academicYear = $student->academic_year;
            
            // Check if student already has a clearance request in this academic year (semester)
            $existingInSemester = ClearanceRequest::where('student_id', $studentId)
                ->where('academic_year', $academicYear)
                ->first();
            
            if ($existingInSemester) {
                throw new Exception('You have already requested clearance in this academic year (' . $academicYear . '). Only one clearance request is allowed per semester.');
            }
            
            // Also check for any active clearance request (regardless of semester)
            $existingActive = ClearanceRequest::where('student_id', $studentId)
                ->whereIn('status', ['draft', 'submitted', 'in_progress'])
                ->first();
            
            if ($existingActive) {
                throw new Exception('Student already has an active clearance request');
            }
            
            // Generate unique clearance number
            $clearanceNumber = $this->generateClearanceNumber($student);
            
            // Create clearance request
            $clearanceRequest = ClearanceRequest::create([
                'student_id' => $studentId,
                'clearance_number' => $clearanceNumber,
                'status' => 'submitted',
                'purpose' => $purpose,
                'program_type' => $programType,
                'reason_for_clearance' => $reasonForClearance,
                'reason_other' => $reasonOther,
                'police_location' => $policeLocation,
                'academic_year' => $academicYear,
                'submitted_at' => now(),
            ]);
            
            // Get workflow steps for this student type
            $workflowSteps = ClearanceWorkflowStep::where('student_type_id', $student->student_type_id)
                ->where('is_active', true)
                ->orderBy('step_order')
                ->get();
            
            if ($workflowSteps->isEmpty()) {
                throw new Exception('No workflow configured for this student type');
            }
            
            // Create clearance items (snapshot of workflow)
            foreach ($workflowSteps as $step) {
                // First step should be PENDING, rest should be LOCKED
                // NOT_REQUIRED steps are set immediately
                $status = 'locked';
                if (!$step->is_required) {
                    $status = 'not_required';
                } elseif ($step->step_order == 1) {
                    $status = 'pending';
                }
                
                ClearanceItem::create([
                    'clearance_request_id' => $clearanceRequest->id,
                    'clearance_office_id' => $step->clearance_office_id,
                    'step_order' => $step->step_order,
                    'is_required' => $step->is_required,
                    'status' => $status,
                ]);
            }
            
            // Log action
            AuditLogService::log(
                'clearance_created',
                "Clearance request created: {$clearanceNumber}",
                'App\Models\ClearanceRequest',
                $clearanceRequest->id,
                ['student_id' => $studentId]
            );
            
            // Send notifications
            NotificationService::notifyClearanceSubmitted($clearanceRequest);
            
            // Notify first office
            $firstItem = $clearanceRequest->clearanceItems()->where('status', 'pending')->first();
            if ($firstItem) {
                NotificationService::notifyClearanceUnderReview($firstItem);
                NotificationService::notifyOfficerNewClearance($firstItem);
            }
            
            DB::commit();
            
            return $clearanceRequest;
            
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Approve a clearance item
     * 
     * @param int $clearanceItemId
     * @param int $userId
     * @param string|null $comment
     * @return ClearanceItem
     * @throws Exception
     */
    public function approveClearanceItem(int $clearanceItemId, int $userId, ?string $comment = null): ClearanceItem
    {
        DB::beginTransaction();
        
        try {
            $clearanceItem = ClearanceItem::with([
                'clearanceRequest.student',
                'clearanceOffice'
            ])->findOrFail($clearanceItemId);
            
            // Validate current status
            if ($clearanceItem->status !== 'pending' && $clearanceItem->status !== 'under_review') {
                throw new Exception("Cannot approve clearance with status: {$clearanceItem->status}");
            }
            
            // Verify previous required step is approved
            $this->verifyPreviousStepApproved($clearanceItem);
            
            // Update clearance item
            $clearanceItem->update([
                'status' => 'approved',
                'processed_by' => $userId,
                'processed_at' => now(),
            ]);
            
            // Create action record
            ClearanceAction::create([
                'clearance_item_id' => $clearanceItemId,
                'user_id' => $userId,
                'action' => 'approved',
                'comment' => $comment,
            ]);
            
            // Chat history is bound to the active workflow step: once this step is
            // approved, the conversation has served its purpose and is cleared, so
            // the same office starts fresh if the student ever re-applies.
            \App\Models\ChatMessage::where('clearance_item_id', $clearanceItemId)->delete();

            // Unlock next required step
            $this->unlockNextStep($clearanceItem);
            
            // Check if all required steps are completed
            $this->checkFinalClearance($clearanceItem->clearanceRequest);
            
            // Log action
            AuditLogService::logClearance(
                'clearance_approved',
                $clearanceItemId,
                "Clearance approved by {$clearanceItem->clearanceOffice->name}",
                ['user_id' => $userId]
            );
            
            // Send notifications
            NotificationService::notifyClearanceApproved($clearanceItem);
            
            DB::commit();
            
            return $clearanceItem->fresh();
            
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Reject a clearance item
     * 
     * @param int $clearanceItemId
     * @param int $userId
     * @param string $reason
     * @param string|null $comment
     * @return ClearanceItem
     * @throws Exception
     */
    public function rejectClearanceItem(int $clearanceItemId, int $userId, string $reason, ?string $comment = null): ClearanceItem
    {
        DB::beginTransaction();
        
        try {
            $clearanceItem = ClearanceItem::with([
                'clearanceRequest.student',
                'clearanceOffice'
            ])->findOrFail($clearanceItemId);
            
            // Validate current status
            if ($clearanceItem->status !== 'pending' && $clearanceItem->status !== 'under_review') {
                throw new Exception("Cannot reject clearance with status: {$clearanceItem->status}");
            }
            
            // Update clearance item
            $clearanceItem->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'processed_by' => $userId,
                'processed_at' => now(),
            ]);
            
            // Create action record
            ClearanceAction::create([
                'clearance_item_id' => $clearanceItemId,
                'user_id' => $userId,
                'action' => 'rejected',
                'comment' => $comment,
                'metadata' => json_encode(['reason' => $reason]),
            ]);
            
            // Lock all subsequent steps
            $this->lockSubsequentSteps($clearanceItem);
            
            // Update clearance request status
            $clearanceItem->clearanceRequest->update([
                'status' => 'rejected',
            ]);
            
            // Log action
            AuditLogService::logClearance(
                'clearance_rejected',
                $clearanceItemId,
                "Clearance rejected by {$clearanceItem->clearanceOffice->name}: {$reason}",
                ['user_id' => $userId, 'reason' => $reason]
            );
            
            // Send notification
            NotificationService::notifyClearanceRejected($clearanceItem);
            
            DB::commit();
            
            return $clearanceItem->fresh();
            
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Resubmit a rejected clearance item
     * 
     * @param int $clearanceItemId
     * @return ClearanceItem
     * @throws Exception
     */
    public function resubmitClearanceItem(int $clearanceItemId): ClearanceItem
    {
        DB::beginTransaction();
        
        try {
            $clearanceItem = ClearanceItem::with('clearanceRequest')->findOrFail($clearanceItemId);
            
            // Validate current status
            if ($clearanceItem->status !== 'rejected') {
                throw new Exception("Can only resubmit rejected clearances");
            }
            
            // Fresh review round: clear the previous round's conversation so the
            // office and student start the resubmitted step with a clean chat.
            \App\Models\ChatMessage::where('clearance_item_id', $clearanceItemId)->delete();

            // Update clearance item
            $clearanceItem->update([
                'status' => 'pending',
                'rejection_reason' => null,
                'processed_by' => null,
                'processed_at' => null,
            ]);
            
            // Create action record
            ClearanceAction::create([
                'clearance_item_id' => $clearanceItemId,
                'user_id' => Auth::id(),
                'action' => 'resubmitted',
            ]);
            
            // Update clearance request status
            $clearanceItem->clearanceRequest->update([
                'status' => 'in_progress',
            ]);
            
            // Log action
            AuditLogService::logClearance(
                'clearance_resubmitted',
                $clearanceItemId,
                "Clearance resubmitted after rejection"
            );
            
            DB::commit();
            
            return $clearanceItem->fresh();
            
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Verify that the previous required step is approved
     * 
     * @param ClearanceItem $clearanceItem
     * @throws Exception
     */
    protected function verifyPreviousStepApproved(ClearanceItem $clearanceItem): void
    {
        // Get previous required step
        $previousStep = ClearanceItem::where('clearance_request_id', $clearanceItem->clearance_request_id)
            ->where('is_required', true)
            ->where('step_order', '<', $clearanceItem->step_order)
            ->orderBy('step_order', 'desc')
            ->first();
        
        if ($previousStep && $previousStep->status !== 'approved') {
            throw new Exception(
                "Cannot approve this step. Previous required step (Order {$previousStep->step_order}) must be approved first."
            );
        }
    }
    
    /**
     * Unlock the next required step
     * 
     * @param ClearanceItem $clearanceItem
     */
    protected function unlockNextStep(ClearanceItem $clearanceItem): void
    {
        // Find next required step that is locked
        $nextStep = ClearanceItem::where('clearance_request_id', $clearanceItem->clearance_request_id)
            ->where('is_required', true)
            ->where('step_order', '>', $clearanceItem->step_order)
            ->where('status', 'locked')
            ->orderBy('step_order')
            ->first();
        
        if ($nextStep) {
            $nextStep->update(['status' => 'pending']);
            
            // Log unlock
            AuditLogService::logClearance(
                'clearance_unlocked',
                $nextStep->id,
                "Clearance item unlocked for processing"
            );
            
            // Notify officers
            NotificationService::notifyClearanceUnderReview($nextStep);
            NotificationService::notifyOfficerNewClearance($nextStep);
        }
    }
    
    /**
     * Lock all subsequent steps after rejection
     * 
     * @param ClearanceItem $clearanceItem
     */
    protected function lockSubsequentSteps(ClearanceItem $clearanceItem): void
    {
        ClearanceItem::where('clearance_request_id', $clearanceItem->clearance_request_id)
            ->where('step_order', '>', $clearanceItem->step_order)
            ->where('status', '!=', 'not_required')
            ->update(['status' => 'locked']);
    }
    
    /**
     * Check if all required steps are completed and finalize clearance
     * 
     * @param ClearanceRequest $clearanceRequest
     */
    protected function checkFinalClearance(ClearanceRequest $clearanceRequest): void
    {
        // Get all required items
        $requiredItems = ClearanceItem::where('clearance_request_id', $clearanceRequest->id)
            ->where('is_required', true)
            ->get();
        
        // Check if all are approved
        $allApproved = $requiredItems->every(function ($item) {
            return $item->status === 'approved';
        });
        
        if ($allApproved) {
            // Final clearance completed
            $clearanceRequest->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
            
            // Generate certificate
            $this->generateCertificate($clearanceRequest);
            
            // Log completion
            AuditLogService::log(
                'clearance_completed',
                "Final clearance completed: {$clearanceRequest->clearance_number}",
                'App\Models\ClearanceRequest',
                $clearanceRequest->id
            );
            
            // Notify student
            NotificationService::notifyFinalClearanceCompleted($clearanceRequest);
        } else {
            // Still in progress
            $clearanceRequest->update([
                'status' => 'in_progress',
            ]);
        }
    }
    
    /**
     * Generate clearance certificate
     * 
     * @param ClearanceRequest $clearanceRequest
     * @return Certificate
     */
    protected function generateCertificate(ClearanceRequest $clearanceRequest): Certificate
    {
        // Generate certificate number
        $certificateNumber = 'CERT-' . date('Y') . '-' . str_pad($clearanceRequest->id, 6, '0', STR_PAD_LEFT);
        
        // Generate verification code
        $verificationCode = strtoupper(bin2hex(random_bytes(8)));
        
        // Create certificate
        $certificate = Certificate::create([
            'clearance_request_id' => $clearanceRequest->id,
            'certificate_number' => $certificateNumber,
            'verification_code' => $verificationCode,
            'issued_date' => now(),
            'issued_by' => Auth::id(),
        ]);
        
        // Log certificate generation
        AuditLogService::log(
            'certificate_generated',
            "Certificate generated: {$certificateNumber}",
            'App\Models\Certificate',
            $certificate->id
        );
        
        return $certificate;
    }
    
    /**
     * Generate unique clearance number
     * 
     * @param Student $student
     * @return string
     */
    protected function generateClearanceNumber(Student $student): string
    {
        $year = date('Y');
        $typeCode = strtoupper(substr($student->studentType->code, 0, 3));
        $deptCode = $student->department->code;
        
        // Get count of clearances this year for this student type
        $count = ClearanceRequest::whereYear('created_at', $year)
            ->whereHas('student', function ($query) use ($student) {
                $query->where('student_type_id', $student->student_type_id);
            })
            ->count() + 1;
        
        return "CLR-{$year}-{$typeCode}-{$deptCode}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
    
    /**
     * Get clearance progress percentage
     * 
     * @param int $clearanceRequestId
     * @return int
     */
    public function getClearanceProgress(int $clearanceRequestId): int
    {
        $totalRequired = ClearanceItem::where('clearance_request_id', $clearanceRequestId)
            ->where('is_required', true)
            ->count();
        
        if ($totalRequired === 0) {
            return 0;
        }
        
        $approved = ClearanceItem::where('clearance_request_id', $clearanceRequestId)
            ->where('is_required', true)
            ->where('status', 'approved')
            ->count();
        
        return round(($approved / $totalRequired) * 100);
    }
}

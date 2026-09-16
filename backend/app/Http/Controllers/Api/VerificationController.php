<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    /**
     * Public endpoint to verify a clearance certificate by verification code.
     * No authentication required — this is the QR code target.
     */
    public function verify($code)
    {
        $certificate = Certificate::with([
            'clearanceRequest.student.department.college',
            'clearanceRequest.student.program',
            'clearanceRequest.student.studentType',
            'clearanceRequest.clearanceItems.clearanceOffice',
            'clearanceRequest.clearanceItems.processedBy',
            'issuedBy',
        ])->where('verification_code', $code)->first();

        if (!$certificate) {
            return response()->json([
                'success' => false,
                'verified' => false,
                'message' => 'Certificate verification code not found. This certificate may be invalid.',
            ], 404);
        }

        // Check if the clearance is still completed
        $clearanceRequest = $certificate->clearanceRequest;
        $isCompleted = $clearanceRequest && $clearanceRequest->status === 'completed';

        $student = $clearanceRequest ? $clearanceRequest->student : null;

        $workflowSummary = [];
        if ($clearanceRequest) {
            foreach ($clearanceRequest->clearanceItems as $item) {
                $workflowSummary[] = [
                    'office' => $item->clearanceOffice ? $item->clearanceOffice->name : 'N/A',
                    'name' => $item->processedBy ? $item->processedBy->name : 'N/A',
                    'status' => $item->status,
                    'is_required' => (bool) $item->is_required,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'verified' => $isCompleted,
            'data' => [
                'university' => 'Madda Walabu University',
                'certificate_number' => $certificate->certificate_number,
                'verification_code' => $certificate->verification_code,
                'issued_date' => $certificate->issued_date ? $certificate->issued_date->format('F d, Y') : null,
                'issued_by' => $certificate->issuedBy ? $certificate->issuedBy->name : 'System',
                'status' => $isCompleted ? 'VERIFIED' : 'INVALID',
                'student' => $student ? [
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'student_id' => $student->student_id,
                    'department' => $student->department ? $student->department->name : 'N/A',
                    'college' => $student->department && $student->department->college ? $student->department->college->name : 'N/A',
                    'program' => $student->program ? $student->program->name : 'N/A',
                    'student_type' => $student->studentType ? $student->studentType->name : 'N/A',
                    'academic_year' => $student->academic_year,
                ] : null,
                'clearance' => $clearanceRequest ? [
                    'clearance_number' => $clearanceRequest->clearance_number,
                    'status' => $clearanceRequest->status,
                    'completed_at' => $clearanceRequest->completed_at,
                ] : null,
                'workflow' => $workflowSummary,
            ],
        ]);
    }
}

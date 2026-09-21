<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClearanceRequestResource;
use App\Models\ClearanceRequest;
use App\Models\Student;
use App\Services\ClearanceService;
use Illuminate\Http\Request;
use Exception;

class StudentClearanceController extends Controller
{
    protected $clearanceService;

    public function __construct(ClearanceService $clearanceService)
    {
        $this->clearanceService = $clearanceService;
    }

    /**
     * Get student's clearance requests
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get student record
            $student = Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student record not found',
                ], 404);
            }
            
            // Get all clearance requests for this student
            $clearanceRequests = ClearanceRequest::where('student_id', $student->id)
                ->with(['clearanceItems.clearanceOffice', 'certificate'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => ClearanceRequestResource::collection($clearanceRequests),
            ], 200);
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Create a new clearance request
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'purpose' => 'nullable|string|max:500',
                'program_type' => 'nullable|in:regular,extension,summer,regular_in_service,winter_in_service',
                'reason_for_clearance' => 'required|in:end_of_semester,withdrawal,academic_dismissal,graduation,other',
                'reason_other' => 'nullable|string|max:255',
                'police_location' => 'nullable|in:robe,goba,shashemene',
            ]);
            
            $user = $request->user();
            
            // Get student record
            $student = Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student record not found',
                ], 404);
            }
            
            // Create clearance request
            $clearanceRequest = $this->clearanceService->createClearanceRequest(
                $student->id,
                $request->purpose,
                $request->program_type,
                $request->reason_for_clearance,
                $request->reason_for_clearance === 'other' ? $request->reason_other : null,
                $request->police_location
            );
            
            // Load relationships
            $clearanceRequest->load(['clearanceItems.clearanceOffice', 'student']);
            
            return response()->json([
                'success' => true,
                'message' => 'Clearance request created successfully',
                'data' => new ClearanceRequestResource($clearanceRequest),
            ], 201);
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 400);
        }
    }

    /**
     * Get a specific clearance request
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Get student record
            $student = Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student record not found',
                ], 404);
            }
            
            // Get clearance request
            $clearanceRequest = ClearanceRequest::where('id', $id)
                ->where('student_id', $student->id)
                ->with([
                    'clearanceItems.clearanceOffice',
                    'clearanceItems.processedBy',
                    'clearanceItems.actions.user',
                    'clearanceItems.comments.user',
                    'certificate'
                ])
                ->first();
            
            if (!$clearanceRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Clearance request not found',
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => new ClearanceRequestResource($clearanceRequest),
            ], 200);
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get clearance progress
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function progress(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Get student record
            $student = Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student record not found',
                ], 404);
            }
            
            // Verify ownership
            $clearanceRequest = ClearanceRequest::where('id', $id)
                ->where('student_id', $student->id)
                ->first();
            
            if (!$clearanceRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Clearance request not found',
                ], 404);
            }
            
            $progress = $this->clearanceService->getClearanceProgress($id);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'clearance_request_id' => $id,
                    'progress_percentage' => $progress,
                    'status' => $clearanceRequest->status,
                ],
            ], 200);
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Resubmit a rejected clearance item
     *
     * @param Request $request
     * @param int $itemId
     * @return \Illuminate\Http\JsonResponse
     */
    public function resubmit(Request $request, $itemId)
    {
        try {
            $user = $request->user();
            
            // Get student record
            $student = Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student record not found',
                ], 404);
            }
            
            // Verify the clearance item belongs to this student
            $clearanceItem = \App\Models\ClearanceItem::with('clearanceRequest')
                ->findOrFail($itemId);
            
            if ($clearanceItem->clearanceRequest->student_id !== $student->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }
            
            // Resubmit
            $clearanceItem = $this->clearanceService->resubmitClearanceItem($itemId);
            
            return response()->json([
                'success' => true,
                'message' => 'Clearance item resubmitted successfully',
                'data' => [
                    'clearance_item_id' => $clearanceItem->id,
                    'status' => $clearanceItem->status,
                ],
            ], 200);
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 400);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClearanceItemResource;
use App\Http\Resources\ClearanceRequestResource;
use App\Models\ClearanceItem;
use App\Models\ClearanceRequest;
use App\Models\ClearanceComment;
use App\Models\Student;
use App\Http\Resources\ClearanceCommentResource;
use App\Services\ClearanceService;
use Illuminate\Http\Request;
use Exception;

class ClearanceController extends Controller
{
    protected $clearanceService;

    public function __construct(ClearanceService $clearanceService)
    {
        $this->clearanceService = $clearanceService;
    }

    /**
     * Check if an officer is authorized for a clearance item.
     * Officers with a department_id (advisors, dept heads) can only
     * act on students from their own department. Centralized officers
     * (library, lab, etc.) see all students.
     */
    protected function isOfficerAuthorized($user, ClearanceItem $item): bool
    {
        // Office must match
        if ($item->clearance_office_id !== $user->clearance_office_id) {
            return false;
        }

        $student = $item->clearanceRequest
            ? $item->clearanceRequest->student
            : null;

        // Department-scoped officers (advisor, dept head, laboratory): the
        // student must belong to their department.
        if ($user->department_id) {
            $studentDeptId = $student ? $student->department_id : null;
            if ($studentDeptId && $studentDeptId !== $user->department_id) {
                return false;
            }

            return true;
        }

        // College-scoped officers (e.g. Continuing Education): the student's
        // department must belong to their college.
        if ($user->college_id) {
            $studentCollegeId = ($student && $student->department)
                ? $student->department->college_id
                : null;
            if ($studentCollegeId && $studentCollegeId !== $user->college_id) {
                return false;
            }
        }

        return true;
    }

    /**
     * Apply department scope to a clearance-item query.
     * For officers with a department_id, restrict to students in that department.
     */
    protected function applyDepartmentScope($query, $user)
    {
        if ($user->department_id) {
            $query->whereHas('clearanceRequest.student', function ($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        } elseif ($user->college_id) {
            // College-scoped officers (e.g. Continuing Education) see students
            // from every department of their college.
            $query->whereHas('clearanceRequest.student.department', function ($q) use ($user) {
                $q->where('college_id', $user->college_id);
            });
        }
        return $query;
    }

    /**
     * Get clearance items pending for current officer
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function pending(Request $request)
    {
        try {
            $user = $request->user();
            
            // Check if user has clearance office assigned
            if (!$user->clearance_office_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not assigned to any clearance office',
                ], 403);
            }
            
            // Get pending clearance items for this office
            $query = ClearanceItem::where('clearance_office_id', $user->clearance_office_id)
                ->whereIn('status', ['pending', 'under_review'])
                ->with([
                    'clearanceRequest.student.department',
                    'clearanceRequest.student.studentType',
                    'clearanceOffice'
                ])
                ->orderBy('created_at', 'asc');
            
            // Scope to officer's department (advisors / dept heads only)
            $this->applyDepartmentScope($query, $user);
            
            $clearanceItems = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => ClearanceItemResource::collection($clearanceItems),
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
     * Get a specific clearance item
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            $clearanceItem = ClearanceItem::with([
                'clearanceRequest.student.department',
                'clearanceRequest.student.program',
                'clearanceRequest.student.studentType',
                'clearanceRequest.clearanceItems.clearanceOffice',
                'clearanceOffice',
                'processedBy',
                'actions.user',
                'comments.user'
            ])->findOrFail($id);
            
            // Check authorization (office + department scope)
            if (!$this->isOfficerAuthorized($user, $clearanceItem) && !$user->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }
            
            return response()->json([
                'success' => true,
                'data' => new ClearanceItemResource($clearanceItem),
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
     * Approve a clearance item
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function approve(Request $request, $id)
    {
        try {
            $request->validate([
                'comment' => 'nullable|string|max:1000',
            ]);
            
            $user = $request->user();
            
            $clearanceItem = ClearanceItem::with(['clearanceOffice', 'clearanceRequest.student'])->findOrFail($id);
            
            // Check authorization (office + department scope)
            if (!$this->isOfficerAuthorized($user, $clearanceItem)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authorized to approve this clearance',
                ], 403);
            }
            
            // Approve
            $clearanceItem = $this->clearanceService->approveClearanceItem(
                $id,
                $user->id,
                $request->comment
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Clearance approved successfully',
                'data' => new ClearanceItemResource($clearanceItem),
            ], 200);
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 400);
        }
    }

    /**
     * Reject a clearance item
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function reject(Request $request, $id)
    {
        try {
            $request->validate([
                'reason' => 'required|string|max:1000',
                'comment' => 'nullable|string|max:1000',
            ]);
            
            $user = $request->user();
            
            $clearanceItem = ClearanceItem::with(['clearanceOffice', 'clearanceRequest.student'])->findOrFail($id);
            
            // Check authorization (office + department scope)
            if (!$this->isOfficerAuthorized($user, $clearanceItem)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authorized to reject this clearance',
                ], 403);
            }
            
            // Reject
            $clearanceItem = $this->clearanceService->rejectClearanceItem(
                $id,
                $user->id,
                $request->reason,
                $request->comment
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Clearance rejected successfully',
                'data' => new ClearanceItemResource($clearanceItem),
            ], 200);
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 400);
        }
    }

    /**
     * Get clearance history (approved/rejected)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function history(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->clearance_office_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not assigned to any clearance office',
                ], 403);
            }
            
            $query = ClearanceItem::where('clearance_office_id', $user->clearance_office_id)
                ->whereIn('status', ['approved', 'rejected'])
                ->with([
                    'clearanceRequest.student.department',
                    'clearanceRequest.student.studentType',
                    'clearanceOffice',
                    'processedBy'
                ])
                ->orderBy('processed_at', 'desc');
            
            // Scope to officer's department (advisors / dept heads only)
            $this->applyDepartmentScope($query, $user);
            
            $clearanceItems = $query->paginate(20);
            
            return response()->json([
                'success' => true,
                'data' => ClearanceItemResource::collection($clearanceItems),
                'pagination' => [
                    'total' => $clearanceItems->total(),
                    'per_page' => $clearanceItems->perPage(),
                    'current_page' => $clearanceItems->currentPage(),
                    'last_page' => $clearanceItems->lastPage(),
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
     * Get statistics for current officer
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->clearance_office_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not assigned to any clearance office',
                ], 403);
            }
            
            $query = ClearanceItem::where('clearance_office_id', $user->clearance_office_id);
            
            // Scope to officer's department (advisors / dept heads only)
            $this->applyDepartmentScope($query, $user);
            
            $pending = (clone $query)->whereIn('status', ['pending', 'under_review'])->count();
            $approved = (clone $query)->where('status', 'approved')->count();
            $rejected = (clone $query)->where('status', 'rejected')->count();
            $total = (clone $query)->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'pending' => $pending,
                    'approved' => $approved,
                    'rejected' => $rejected,
                    'total' => $total,
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
     * Add a comment to a clearance item
     *
     * @param Request $request
     * @param int $id (clearance item id)
     * @return \Illuminate\Http\JsonResponse
     */
    public function addComment(Request $request, $id)
    {
        try {
            $request->validate([
                'comment' => 'required|string|max:2000',
                'is_internal' => 'sometimes|boolean',
            ]);

            $user = $request->user();

            $clearanceItem = ClearanceItem::with('clearanceRequest.student.department')->findOrFail($id);

            // Check authorization: officer assigned to this office, student who owns the clearance, or admin
            $isAuthorized = false;
            if ($clearanceItem->clearance_office_id === $user->clearance_office_id) {
                $isAuthorized = true;
            }
            if ($user->hasRole('admin')) {
                $isAuthorized = true;
            }
            if ($clearanceItem->clearanceRequest && $clearanceItem->clearanceRequest->student) {
                if ($clearanceItem->clearanceRequest->student->user_id === $user->id) {
                    $isAuthorized = true;
                }
            }

            if (!$isAuthorized) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authorized to comment on this clearance item',
                ], 403);
            }

            $comment = ClearanceComment::create([
                'clearance_item_id' => $id,
                'user_id' => $user->id,
                'comment' => $request->comment,
                'is_internal' => $request->get('is_internal', false),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Comment added successfully',
                'data' => new ClearanceCommentResource($comment->load('user.role')),
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add comment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get comments for a clearance item
     *
     * @param int $id (clearance item id)
     * @return \Illuminate\Http\JsonResponse
     */
    public function getComments($id)
    {
        try {
            $comments = ClearanceComment::where('clearance_item_id', $id)
                ->with('user.role')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => ClearanceCommentResource::collection($comments),
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
            ], 500);
        }
    }
}

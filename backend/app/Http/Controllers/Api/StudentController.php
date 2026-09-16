<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Models\ClearanceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentController extends Controller
{
    /**
     * Get list of students with filters and pagination
     * Admin: can see all students
     * Department officers: can see only students in their department
     * College officers: can see only students in their college
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = Student::with(['user', 'department.college', 'program', 'studentType']);
        
        // Apply department-based authorization
        if ($user->department_id) {
            $query->where('department_id', $user->department_id);
        } elseif ($user->college_id) {
            $query->whereHas('department', function($q) use ($user) {
                $q->where('college_id', $user->college_id);
            });
        }
        // Admin can see all students (no filter)
        
        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('student_id', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhereHas('user', function($q) use ($search) {
                      $q->where('email', 'like', "%{$search}%");
                  });
            });
        }
        
        // Department filter
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        
        // College filter
        if ($request->filled('college_id')) {
            $query->whereHas('department', function($q) use ($request) {
                $q->where('college_id', $request->college_id);
            });
        }
        
        // Program filter
        if ($request->filled('program_id')) {
            $query->where('program_id', $request->program_id);
        }
        
        // Student type filter
        if ($request->filled('student_type_id')) {
            $query->where('student_type_id', $request->student_type_id);
        }
        
        // Academic year filter
        if ($request->filled('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }
        
        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);
        
        // Pagination
        $perPage = $request->get('per_page', 100);
        $students = $query->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => StudentResource::collection($students),
            'meta' => [
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'per_page' => $students->perPage(),
                'total' => $students->total(),
            ],
        ]);
    }
    
    /**
     * Get student details with clearance history
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $query = Student::with([
            'user',
            'department.college',
            'program',
            'studentType',
            'clearanceRequests.clearanceItems.clearanceOffice',
            'clearanceRequests.certificate',
        ]);
        
        // Apply department-based authorization
        if ($user->department_id) {
            $query->where('department_id', $user->department_id);
        } elseif ($user->college_id) {
            $query->whereHas('department', function($q) use ($user) {
                $q->where('college_id', $user->college_id);
            });
        }
        
        $student = $query->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => new StudentResource($student),
        ]);
    }
    
    /**
     * Get student clearance history
     */
    public function clearanceHistory($id)
    {
        $user = Auth::user();
        
        $student = Student::findOrFail($id);
        
        // Check authorization
        if ($user->department_id && $student->department_id !== $user->department_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view this student',
            ], 403);
        }
        
        if ($user->college_id) {
            $studentCollege = $student->department->college_id;
            if ($studentCollege !== $user->college_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to view this student',
                ], 403);
            }
        }
        
        $clearanceRequests = ClearanceRequest::where('student_id', $id)
            ->with([
                'clearanceItems.clearanceOffice',
                'clearanceItems.processedBy',
                'clearanceItems.actions',
                'clearanceItems.comments',
                'certificate',
            ])
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $clearanceRequests,
        ]);
    }
    
    /**
     * Get student statistics
     */
    public function statistics($id)
    {
        $user = Auth::user();
        
        $student = Student::findOrFail($id);
        
        // Check authorization
        if ($user->department_id && $student->department_id !== $user->department_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view this student',
            ], 403);
        }
        
        $totalClearances = ClearanceRequest::where('student_id', $id)->count();
        $completedClearances = ClearanceRequest::where('student_id', $id)
            ->where('status', 'completed')
            ->count();
        $inProgressClearances = ClearanceRequest::where('student_id', $id)
            ->where('status', 'in_progress')
            ->count();
        $rejectedClearances = ClearanceRequest::where('student_id', $id)
            ->where('status', 'rejected')
            ->count();
        
        // Get average completion time for completed clearances
        $avgCompletionTime = ClearanceRequest::where('student_id', $id)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, submitted_at, completed_at)) as avg_hours')
            ->first();
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_clearances' => $totalClearances,
                'completed_clearances' => $completedClearances,
                'in_progress_clearances' => $inProgressClearances,
                'rejected_clearances' => $rejectedClearances,
                'completion_rate' => $totalClearances > 0 
                    ? round(($completedClearances / $totalClearances) * 100, 2) 
                    : 0,
                'average_completion_hours' => $avgCompletionTime ? round($avgCompletionTime->avg_hours, 2) : null,
            ],
        ]);
    }
    
    /**
     * Search students (lighter endpoint for autocomplete)
     */
    public function search(Request $request)
    {
        $user = Auth::user();
        
        $query = Student::with(['user', 'department', 'program']);
        
        // Apply department-based authorization
        if ($user->department_id) {
            $query->where('department_id', $user->department_id);
        } elseif ($user->college_id) {
            $query->whereHas('department', function($q) use ($user) {
                $q->where('college_id', $user->college_id);
            });
        }
        
        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(function($q) use ($search) {
                $q->where('student_id', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhereHas('user', function($q) use ($search) {
                      $q->where('email', 'like', "%{$search}%");
                  });
            });
        }
        
        $students = $query->limit(10)->get();
        
        return response()->json([
            'success' => true,
            'data' => $students->map(function($student) {
                return [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'email' => $student->user ? $student->user->email : null,
                    'department' => $student->department ? $student->department->name : null,
                    'program' => $student->program ? $student->program->name : null,
                ];
            }),
        ]);
    }
    
    /**
     * Get students summary count
     */
    public function summary()
    {
        $user = Auth::user();
        
        $query = Student::query();
        
        // Apply department-based authorization
        if ($user->department_id) {
            $query->where('department_id', $user->department_id);
        } elseif ($user->college_id) {
            $query->whereHas('department', function($q) use ($user) {
                $q->where('college_id', $user->college_id);
            });
        }
        
        $total = $query->count();
        $active = (clone $query)->where('status', 'active')->count();
        $inactive = (clone $query)->where('status', 'inactive')->count();
        $graduated = (clone $query)->where('status', 'graduated')->count();
        
        // Count by student type
        $byType = (clone $query)
            ->selectRaw('student_type_id, COUNT(*) as count')
            ->groupBy('student_type_id')
            ->with('studentType')
            ->get()
            ->map(function($item) {
                return [
                    'type' => $item->studentType ? $item->studentType->name : 'Unknown',
                    'count' => $item->count,
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'graduated' => $graduated,
                'by_type' => $byType,
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClearanceRequest;
use App\Models\ClearanceItem;
use App\Models\Student;
use App\Models\Department;
use App\Models\College;
use App\Models\StudentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class ReportsController extends Controller
{
    /**
     * Student clearance report — all clearances for a student
     */
    public function studentReport(Request $request, $studentId)
    {
        $student = Student::with(['department.college', 'program', 'studentType'])->findOrFail($studentId);

        $clearances = ClearanceRequest::where('student_id', $studentId)
            ->with([
                'clearanceItems.clearanceOffice',
                'clearanceItems.processedBy',
                'certificate',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'student' => [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'name' => $student->full_name,
                    'department' => $student->department ? $student->department->name : 'N/A',
                    'college' => $student->department && $student->department->college ? $student->department->college->name : 'N/A',
                    'program' => $student->program ? $student->program->name : 'N/A',
                    'student_type' => $student->studentType ? $student->studentType->name : 'N/A',
                    'academic_year' => $student->academic_year,
                ],
                'clearances' => $clearances->map(function ($cr) {
                    return [
                        'id' => $cr->id,
                        'clearance_number' => $cr->clearance_number,
                        'status' => $cr->status,
                        'purpose' => $cr->purpose,
                        'submitted_at' => $cr->submitted_at,
                        'completed_at' => $cr->completed_at,
                        'items' => $cr->clearanceItems->map(function ($item) {
                            return [
                                'office' => $item->clearanceOffice ? $item->clearanceOffice->name : 'N/A',
                                'status' => $item->status,
                                'is_required' => (bool) $item->is_required,
                                'step_order' => $item->step_order,
                                'processed_by' => $item->processedBy ? $item->processedBy->name : null,
                                'processed_at' => $item->processed_at,
                            ];
                        }),
                        'certificate' => $cr->certificate ? [
                            'certificate_number' => $cr->certificate->certificate_number,
                            'issued_date' => $cr->certificate->issued_date,
                            'verification_code' => $cr->certificate->verification_code,
                        ] : null,
                    ];
                }),
                'total_clearances' => $clearances->count(),
                'completed' => $clearances->where('status', 'completed')->count(),
                'in_progress' => $clearances->where('status', 'in_progress')->count(),
                'rejected' => $clearances->where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Department clearance report — all clearances within a department
     */
    public function departmentReport(Request $request)
    {
        $query = ClearanceRequest::with([
            'student.department',
            'student.studentType',
            'clearanceItems.clearanceOffice',
            'certificate',
        ]);

        // Filters
        if ($request->filled('department_id')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        if ($request->filled('student_type_id')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('student_type_id', $request->student_type_id);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('academic_year')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('academic_year', $request->academic_year);
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('submitted_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('submitted_at', '<=', $request->to_date);
        }

        // Department- or college-based access for non-admins
        $user = $request->user();
        if ($user->department_id && !$user->hasRole('admin')) {
            $query->whereHas('student', function ($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        } elseif ($user->college_id && !$user->hasRole('admin')) {
            // College-scoped officers (e.g. Continuing Education) see every
            // department of their college.
            $query->whereHas('student.department', function ($q) use ($user) {
                $q->where('college_id', $user->college_id);
            });
        }

        $clearances = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));

        // Summary statistics
        $summaryQuery = clone $query;
        $totalCount = $summaryQuery->count();
        $completedCount = (clone $query)->where('status', 'completed')->count();
        $inProgressCount = (clone $query)->where('status', 'in_progress')->count();
        $rejectedCount = (clone $query)->where('status', 'rejected')->count();

        return response()->json([
            'success' => true,
            'data' => $clearances->map(function ($cr) {
                $student = $cr->student;
                return [
                    'id' => $cr->id,
                    'clearance_number' => $cr->clearance_number,
                    'student' => [
                        'student_id' => $student->student_id,
                        'name' => $student->full_name,
                        'department' => $student->department ? $student->department->name : 'N/A',
                        'student_type' => $student->studentType ? $student->studentType->name : 'N/A',
                    ],
                    'status' => $cr->status,
                    'submitted_at' => $cr->submitted_at,
                    'completed_at' => $cr->completed_at,
                    'progress' => $cr->clearanceItems->where('status', 'approved')->count() . '/' . $cr->clearanceItems->where('is_required', true)->count(),
                    'has_certificate' => $cr->certificate ? true : false,
                ];
            }),
            'summary' => [
                'total' => $totalCount,
                'completed' => $completedCount,
                'in_progress' => $inProgressCount,
                'rejected' => $rejectedCount,
                'completion_rate' => $totalCount > 0 ? round(($completedCount / $totalCount) * 100, 2) : 0,
            ],
            'meta' => [
                'current_page' => $clearances->currentPage(),
                'last_page' => $clearances->lastPage(),
                'per_page' => $clearances->perPage(),
                'total' => $clearances->total(),
            ],
        ]);
    }

    /**
     * College clearance report
     */
    public function collegeReport(Request $request)
    {
        $query = ClearanceRequest::with([
            'student.department.college',
            'student.studentType',
            'clearanceItems.clearanceOffice',
        ]);

        if ($request->filled('college_id')) {
            $query->whereHas('student.department', function ($q) use ($request) {
                $q->where('college_id', $request->college_id);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('submitted_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('submitted_at', '<=', $request->to_date);
        }

        // Stats by department
        $byDepartment = ClearanceRequest::select('students.department_id')
            ->join('students', 'clearance_requests.student_id', '=', 'students.id')
            ->join('departments', 'students.department_id', '=', 'departments.id')
            ->select(
                'departments.name as department_name',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN clearance_requests.status = "completed" THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN clearance_requests.status = "in_progress" THEN 1 ELSE 0 END) as in_progress'),
                DB::raw('SUM(CASE WHEN clearance_requests.status = "rejected" THEN 1 ELSE 0 END) as rejected')
            )
            ->groupBy('students.department_id', 'departments.name')
            ->orderBy('departments.name')
            ->get();

        $total = $query->count();
        $completed = (clone $query)->where('status', 'completed')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'completed' => $completed,
                'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
                'by_department' => $byDepartment,
            ],
        ]);
    }

    /**
     * Office performance report — clearance items processed by each office
     */
    public function officeReport(Request $request)
    {
        $query = ClearanceItem::with('clearanceOffice')
            ->select(
                'clearance_office_id',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) as approved'),
                DB::raw('SUM(CASE WHEN status = "rejected" THEN 1 ELSE 0 END) as rejected'),
                DB::raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending'),
                DB::raw('SUM(CASE WHEN status = "locked" THEN 1 ELSE 0 END) as locked'),
                DB::raw('AVG(CASE WHEN processed_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, clearance_items.created_at, processed_at) END) as avg_processing_hours')
            )
            ->groupBy('clearance_office_id')
            ->orderBy('clearance_office_id');

        $results = $query->get();

        $officeReport = $results->map(function ($item) {
            return [
                'office' => $item->clearanceOffice ? $item->clearanceOffice->name : 'N/A',
                'total' => $item->total,
                'approved' => $item->approved,
                'rejected' => $item->rejected,
                'pending' => $item->pending,
                'locked' => $item->locked,
                'avg_processing_hours' => $item->avg_processing_hours ? round($item->avg_processing_hours, 2) : null,
                'approval_rate' => $item->total > 0 ? round(($item->approved / $item->total) * 100, 2) : 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $officeReport,
        ]);
    }

    /**
     * Pending clearances report
     */
    public function pendingReport(Request $request)
    {
        $query = ClearanceRequest::with([
            'student.department',
            'student.studentType',
            'clearanceItems.clearanceOffice',
        ])->whereIn('status', ['submitted', 'in_progress']);

        if ($request->filled('department_id')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('submitted_at', '>=', $request->from_date);
        }

        $clearances = $query->orderBy('submitted_at', 'asc')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $clearances->map(function ($cr) {
                $student = $cr->student;
                $currentStep = $cr->clearanceItems->where('status', 'pending')->first();

                return [
                    'id' => $cr->id,
                    'clearance_number' => $cr->clearance_number,
                    'student' => [
                        'student_id' => $student->student_id,
                        'name' => $student->full_name,
                        'department' => $student->department ? $student->department->name : 'N/A',
                        'student_type' => $student->studentType ? $student->studentType->name : 'N/A',
                    ],
                    'status' => $cr->status,
                    'submitted_at' => $cr->submitted_at,
                    'days_pending' => $cr->submitted_at ? now()->diffInDays($cr->submitted_at) : null,
                    'current_office' => $currentStep && $currentStep->clearanceOffice ? $currentStep->clearanceOffice->name : 'N/A',
                    'completed_steps' => $cr->clearanceItems->where('status', 'approved')->count(),
                    'total_steps' => $cr->clearanceItems->where('is_required', true)->count(),
                ];
            }),
            'total_pending' => $clearances->total(),
            'meta' => [
                'current_page' => $clearances->currentPage(),
                'last_page' => $clearances->lastPage(),
                'per_page' => $clearances->perPage(),
                'total' => $clearances->total(),
            ],
        ]);
    }

    /**
     * Rejected clearances report
     */
    public function rejectedReport(Request $request)
    {
        $query = ClearanceRequest::with([
            'student.department',
            'student.studentType',
            'clearanceItems.clearanceOffice',
            'clearanceItems.processedBy',
        ])->where('status', 'rejected');

        if ($request->filled('department_id')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        $clearances = $query->orderBy('updated_at', 'desc')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $clearances->map(function ($cr) {
                $student = $cr->student;
                $rejectedItems = $cr->clearanceItems->where('status', 'rejected');

                return [
                    'id' => $cr->id,
                    'clearance_number' => $cr->clearance_number,
                    'student' => [
                        'student_id' => $student->student_id,
                        'name' => $student->full_name,
                        'department' => $student->department ? $student->department->name : 'N/A',
                    ],
                    'rejected_by' => $rejectedItems->map(function ($item) {
                        return [
                            'office' => $item->clearanceOffice ? $item->clearanceOffice->name : 'N/A',
                            'reason' => $item->rejection_reason,
                            'processed_by' => $item->processedBy ? $item->processedBy->name : 'N/A',
                            'processed_at' => $item->processed_at,
                        ];
                    }),
                    'submitted_at' => $cr->submitted_at,
                ];
            }),
            'total_rejected' => $clearances->total(),
            'meta' => [
                'current_page' => $clearances->currentPage(),
                'last_page' => $clearances->lastPage(),
                'per_page' => $clearances->perPage(),
                'total' => $clearances->total(),
            ],
        ]);
    }

    /**
     * Summary report — overview statistics
     */
    public function summary(Request $request)
    {
        $filters = [];

        if ($request->filled('from_date')) {
            $filters[] = ['submitted_at', '>=', $request->from_date];
        }
        if ($request->filled('to_date')) {
            $filters[] = ['submitted_at', '<=', $request->to_date];
        }

        $baseQuery = ClearanceRequest::query();
        foreach ($filters as $filter) {
            $baseQuery->where($filter[0], $filter[1], $filter[2]);
        }

        $totalClearances = (clone $baseQuery)->count();
        $completedClearances = (clone $baseQuery)->where('status', 'completed')->count();
        $inProgressClearances = (clone $baseQuery)->where('status', 'in_progress')->count();
        $rejectedClearances = (clone $baseQuery)->where('status', 'rejected')->count();
        $submittedClearances = (clone $baseQuery)->where('status', 'submitted')->count();

        // Average processing time
        $avgTime = (clone $baseQuery)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, submitted_at, completed_at)) as avg_hours')
            ->value('avg_hours');

        // By student type
        $byStudentType = (clone $baseQuery)
            ->join('students', 'clearance_requests.student_id', '=', 'students.id')
            ->join('student_types', 'students.student_type_id', '=', 'student_types.id')
            ->select(
                'student_types.name',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN clearance_requests.status = "completed" THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN clearance_requests.status = "in_progress" THEN 1 ELSE 0 END) as in_progress'),
                DB::raw('SUM(CASE WHEN clearance_requests.status = "rejected" THEN 1 ELSE 0 END) as rejected')
            )
            ->groupBy('student_types.name')
            ->get();

        // By department
        $byDepartment = (clone $baseQuery)
            ->join('students', 'clearance_requests.student_id', '=', 'students.id')
            ->join('departments', 'students.department_id', '=', 'departments.id')
            ->select(
                'departments.name',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN clearance_requests.status = "completed" THEN 1 ELSE 0 END) as completed')
            )
            ->groupBy('departments.name')
            ->orderBy('total', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'total' => $totalClearances,
                    'submitted' => $submittedClearances,
                    'in_progress' => $inProgressClearances,
                    'completed' => $completedClearances,
                    'rejected' => $rejectedClearances,
                    'completion_rate' => $totalClearances > 0 ? round(($completedClearances / $totalClearances) * 100, 2) : 0,
                    'rejection_rate' => $totalClearances > 0 ? round(($rejectedClearances / $totalClearances) * 100, 2) : 0,
                    'avg_processing_hours' => $avgTime ? round($avgTime, 2) : null,
                ],
                'by_student_type' => $byStudentType,
                'by_department' => $byDepartment,
            ],
        ]);
    }
}

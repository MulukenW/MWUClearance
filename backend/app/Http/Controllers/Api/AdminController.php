<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use App\Models\ClearanceRequest;
use App\Models\ClearanceItem;
use App\Models\ClearanceOffice;
use App\Models\Department;
use App\Models\College;
use App\Models\Program;
use App\Models\StudentType;
use App\Models\Role;
use App\Models\Notification;
use App\Models\AuditLog;
use App\Http\Resources\UserResource;
use App\Http\Resources\StudentResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Services\AuditLogService;
use Exception;

class AdminController extends Controller
{
    /**
     * Get comprehensive dashboard statistics
     */
    public function dashboard()
    {
        // Students statistics
        $totalStudents = Student::count();
        $activeStudents = Student::where('status', 'active')->count();
        $studentsByType = Student::select('student_type_id', DB::raw('COUNT(*) as count'))
            ->groupBy('student_type_id')
            ->with('studentType:id,name')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => $item->studentType ? $item->studentType->name : 'Unknown',
                    'count' => $item->count,
                ];
            });

        // Clearances statistics
        $totalClearances = ClearanceRequest::count();
        $completedClearances = ClearanceRequest::where('status', 'completed')->count();
        $inProgressClearances = ClearanceRequest::where('status', 'in_progress')->count();
        $rejectedClearances = ClearanceRequest::where('status', 'rejected')->count();

        $clearancesByStatus = ClearanceRequest::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        // Recent clearances
        $recentClearances = ClearanceRequest::with(['student.user', 'student.department'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($clearance) {
                return [
                    'id' => $clearance->id,
                    'clearance_number' => $clearance->clearance_number,
                    'student_name' => $clearance->student->first_name . ' ' . $clearance->student->last_name,
                    'student_id' => $clearance->student->student_id,
                    'department' => $clearance->student->department ? $clearance->student->department->name : 'N/A',
                    'status' => $clearance->status,
                    'submitted_at' => $clearance->submitted_at,
                ];
            });

        // Average completion time
        $avgCompletionTime = ClearanceRequest::where('status', 'completed')
            ->whereNotNull('completed_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, submitted_at, completed_at)) as avg_hours')
            ->first();

        // Users statistics (users have a single role via role_id FK)
        $totalUsers = User::count();
        $usersByRole = User::select('role_id', DB::raw('COUNT(*) as count'))
            ->whereNotNull('role_id')
            ->groupBy('role_id')
            ->with('role:id,name')
            ->get()
            ->map(function ($item) {
                return [
                    'role' => $item->role ? $item->role->name : 'Unknown',
                    'count' => $item->count,
                ];
            });

        // Clearance offices workload
        $officeWorkload = ClearanceItem::select('clearance_office_id')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending')
            ->selectRaw('SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) as approved')
            ->selectRaw('SUM(CASE WHEN status = "rejected" THEN 1 ELSE 0 END) as rejected')
            ->groupBy('clearance_office_id')
            ->with('clearanceOffice:id,name,code')
            ->get()
            ->map(function ($item) {
                return [
                    'office' => $item->clearanceOffice ? $item->clearanceOffice->name : 'Unknown',
                    'total' => $item->total,
                    'pending' => $item->pending,
                    'approved' => $item->approved,
                    'rejected' => $item->rejected,
                ];
            });

        // System activity (last 7 days)
        $activityData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $activityData[] = [
                'date' => $date,
                'clearances_created' => ClearanceRequest::whereDate('created_at', $date)->count(),
                'clearances_completed' => ClearanceRequest::whereDate('completed_at', $date)->count(),
                'items_processed' => ClearanceItem::whereDate('processed_at', $date)->count(),
            ];
        }

        // System overview counts
        $totalColleges = College::where('is_active', true)->count();
        $totalDepartments = Department::where('is_active', true)->count();
        $totalPrograms = Program::where('is_active', true)->count();
        $totalOffices = ClearanceOffice::where('is_active', true)->count();
        $pendingItems = ClearanceItem::where('status', 'pending')->count();
        $lockedItems = ClearanceItem::where('status', 'locked')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'students' => [
                    'total' => $totalStudents,
                    'active' => $activeStudents,
                    'by_type' => $studentsByType,
                ],
                'clearances' => [
                    'total' => $totalClearances,
                    'completed' => $completedClearances,
                    'in_progress' => $inProgressClearances,
                    'rejected' => $rejectedClearances,
                    'by_status' => $clearancesByStatus,
                    'recent' => $recentClearances,
                    'average_completion_hours' => $avgCompletionTime ? round($avgCompletionTime->avg_hours, 2) : null,
                    'pending_items' => $pendingItems,
                    'locked_items' => $lockedItems,
                ],
                'users' => [
                    'total' => $totalUsers,
                    'by_role' => $usersByRole,
                ],
                'offices' => [
                    'workload' => $officeWorkload,
                    'total' => $totalOffices,
                ],
                'system' => [
                    'colleges' => $totalColleges,
                    'departments' => $totalDepartments,
                    'programs' => $totalPrograms,
                    'offices' => $totalOffices,
                    'pending_items' => $pendingItems,
                ],
                'activity' => $activityData,
            ],
        ]);
    }

    /**
     * Get all users with filters
     */
    public function users(Request $request)
    {
        $query = User::with(['role', 'department.college', 'clearanceOffice']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Role filter (by role code)
        if ($request->filled('role')) {
            $role = Role::where('code', $request->role)->first();
            if ($role) {
                $query->where('role_id', $role->id);
            }
        }

        // Department filter
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
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
        $users = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($users),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Get single user details
     */
    public function getUser($id)
    {
        $user = User::with(['role', 'department.college', 'clearanceOffice', 'student'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Create new user
     */
    public function createUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id' => 'required_without:role_code|nullable|exists:roles,id',
            'role_code' => 'required_without:role_id|nullable|exists:roles,code',
            'department_id' => 'nullable|exists:departments,id',
            'clearance_office_id' => 'nullable|exists:clearance_offices,id',
            'status' => 'sometimes|in:active,inactive,suspended',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Get role by ID or code
            if ($request->role_id) {
                $role = Role::find($request->role_id);
            } else {
                $role = Role::where('code', $request->role_code)->first();
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => $role->id,
                'department_id' => $request->department_id,
                'clearance_office_id' => $request->clearance_office_id,
                'status' => $request->get('status', 'active'),
            ]);

            // If role is student and department_id provided, also sync to student record
            if ($role->code === 'student' && $request->department_id) {
                $student = Student::where('user_id', $user->id)->first();
                if ($student) {
                    $student->update(['department_id' => $request->department_id]);
                }
            }

            AuditLogService::log(
                'user_created',
                "User created: {$user->email} (Role: {$role->name})",
                'App\Models\User',
                $user->id,
                ['role' => $role->code]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => new UserResource($user->load('role', 'department', 'clearanceOffice')),
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update user
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'role_id' => 'nullable|exists:roles,id',
            'role_code' => 'nullable|exists:roles,code',
            'department_id' => 'nullable|exists:departments,id',
            'clearance_office_id' => 'nullable|exists:clearance_offices,id',
            'status' => 'sometimes|in:active,inactive,suspended',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $userData = $request->only(['name', 'email', 'department_id', 'clearance_office_id', 'status']);

            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }

            // Update role if provided (by ID or code)
            if ($request->filled('role_id')) {
                $role = Role::find($request->role_id);
                $userData['role_id'] = $role->id;
            } elseif ($request->filled('role_code')) {
                $role = Role::where('code', $request->role_code)->first();
                $userData['role_id'] = $role->id;
            }

            $user->update($userData);

            // If role is student and department_id provided, also sync to student record
            if ($request->department_id) {
                $student = Student::where('user_id', $user->id)->first();
                if ($student) {
                    $student->update(['department_id' => $request->department_id]);
                }
            }

            AuditLogService::log(
                'user_updated',
                "User updated: {$user->email}",
                'App\Models\User',
                $user->id,
                $request->only(['name', 'email', 'role_code', 'department_id', 'status'])
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => new UserResource($user->fresh(['role', 'department.college', 'clearanceOffice'])),
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete user
     */
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        // Prevent deleting own account
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account',
            ], 403);
        }

        DB::beginTransaction();
        try {
            $userEmail = $user->email;
            $user->delete();

            AuditLogService::log(
                'user_deleted',
                "User deleted: {$userEmail}",
                'App\Models\User',
                $id
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get system configuration data
     */
    public function systemConfig()
    {
        $colleges = College::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'description']);

        $departments = Department::with('college:id,name')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'description', 'college_id']);

        $programs = Program::with('department:id,name')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'level', 'description', 'department_id']);

        $studentTypes = StudentType::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'description']);

        $clearanceOffices = ClearanceOffice::where('is_active', true)
            ->orderBy('id')
            ->get(['id', 'name', 'code', 'description']);

        $roles = Role::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'description']);

        return response()->json([
            'success' => true,
            'data' => [
                'colleges' => $colleges,
                'departments' => $departments,
                'programs' => $programs,
                'student_types' => $studentTypes,
                'clearance_offices' => $clearanceOffices,
                'roles' => $roles,
            ],
        ]);
    }

    /**
     * Get audit logs with filters
     */
    public function auditLogs(Request $request)
    {
        $query = AuditLog::with(['user']);

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Sorting
        $query->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->get('per_page', 50);
        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * Get system statistics summary
     */
    public function statistics()
    {
        $stats = [
            'students' => [
                'total' => Student::count(),
                'active' => Student::where('status', 'active')->count(),
                'by_department' => Student::select('department_id', DB::raw('COUNT(*) as count'))
                    ->groupBy('department_id')
                    ->with('department:id,name')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'department' => $item->department ? $item->department->name : 'Unknown',
                            'count' => $item->count,
                        ];
                    }),
            ],
            'clearances' => [
                'total' => ClearanceRequest::count(),
                'completed' => ClearanceRequest::where('status', 'completed')->count(),
                'in_progress' => ClearanceRequest::where('status', 'in_progress')->count(),
                'rejected' => ClearanceRequest::where('status', 'rejected')->count(),
                'completion_rate' => ClearanceRequest::count() > 0
                    ? round((ClearanceRequest::where('status', 'completed')->count() / ClearanceRequest::count()) * 100, 2)
                    : 0,
            ],
            'users' => [
                'total' => User::count(),
                'active' => User::where('status', 'active')->count(),
            ],
            'notifications' => [
                'total' => Notification::count(),
                'unread' => Notification::where('is_read', false)->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Create a new student (with linked user account)
     */
    public function createStudent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'nullable|string|min:8',
            'student_id' => 'required|string|max:50|unique:students,student_id',
            'college_id' => ['required', 'exists:colleges,id', function ($attribute, $value, $fail) use ($request) {
                $departmentId = $request->input('department_id');
                if ($departmentId) {
                    $department = Department::find($departmentId);
                    if ($department && (int) $department->college_id !== (int) $value) {
                        $fail('The selected department must belong to the selected college.');
                    }
                }
            }],
            'department_id' => ['required', 'exists:departments,id', function ($attribute, $value, $fail) use ($request) {
                $collegeId = $request->input('college_id');
                $department = Department::find($value);

                if ($collegeId && $department && (int) $department->college_id !== (int) $collegeId) {
                    $fail('The selected department must belong to the selected college.');
                }
            }],
            'program_id' => ['required', 'exists:programs,id', function ($attribute, $value, $fail) use ($request) {
                $departmentId = $request->input('department_id');
                $program = Program::find($value);

                if ($departmentId && $program && (int) $program->department_id !== (int) $departmentId) {
                    $fail('The selected program must belong to the selected department.');
                }
            }],
            'student_type_id' => 'required|exists:student_types,id',
            'academic_advisor_id' => 'nullable|exists:users,id',
            'academic_year' => 'nullable|string|max:20',
            'admission_year' => 'nullable|integer|min:1990|max:' . (date('Y') + 1),
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Get student role
            $studentRole = Role::where('code', 'student')->first();
            if (!$studentRole) {
                throw new Exception('Student role not found in the system');
            }

            // Auto-generate password if not provided
            $generatedPassword = null;
            if (empty($request->password)) {
                // Generate password: First name initial + Student ID + random 3 digits
                $generatedPassword = strtoupper(substr($request->first_name, 0, 1)) . 
                                   $request->student_id . 
                                   rand(100, 999);
            }
            $passwordToUse = $generatedPassword ?? $request->password;

            // Create user account
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->last_name,
                'email' => $request->email,
                'password' => Hash::make($passwordToUse),
                'role_id' => $studentRole->id,
                'department_id' => $request->department_id,
                'status' => 'active',
            ]);

            // Create student record
            $student = Student::create([
                'user_id' => $user->id,
                'student_id' => $request->student_id,
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'college_id' => $request->college_id,
                'department_id' => $request->department_id,
                'program_id' => $request->program_id,
                'student_type_id' => $request->student_type_id,
                'academic_advisor_id' => $request->academic_advisor_id,
                'academic_year' => $request->academic_year ?? date('Y'),
                'admission_year' => $request->admission_year ?? date('Y'),
                'phone' => $request->phone,
                'email' => $request->email,
                'status' => 'active',
            ]);

            AuditLogService::log(
                'student_created',
                "Student created: {$student->student_id} ({$student->first_name} {$student->last_name})",
                'App\Models\Student',
                $student->id,
                ['student_id' => $student->student_id, 'department_id' => $student->department_id]
            );

            DB::commit();

            $responseData = new StudentResource($student->load(['user', 'department.college', 'program', 'studentType']));
            
            // Include generated password in response if it was auto-generated
            $response = [
                'success' => true,
                'message' => 'Student created successfully',
                'data' => $responseData,
            ];
            
            if ($generatedPassword) {
                $response['credentials'] = [
                    'email' => $request->email,
                    'password' => $generatedPassword,
                    'message' => 'Login credentials have been automatically generated. Please share these with the student.',
                ];
            }

            return response()->json($response, 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create student: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an existing student
     */
    public function updateStudent(Request $request, $id)
    {
        $student = Student::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'college_id' => ['sometimes', 'required', 'exists:colleges,id', function ($attribute, $value, $fail) use ($request) {
                $departmentId = $request->input('department_id');
                if ($departmentId) {
                    $department = Department::find($departmentId);
                    if ($department && (int) $department->college_id !== (int) $value) {
                        $fail('The selected department must belong to the selected college.');
                    }
                }
            }],
            'department_id' => ['sometimes', 'required', 'exists:departments,id', function ($attribute, $value, $fail) use ($request) {
                $collegeId = $request->input('college_id');
                $department = Department::find($value);

                if ($collegeId && $department && (int) $department->college_id !== (int) $collegeId) {
                    $fail('The selected department must belong to the selected college.');
                }
            }],
            'program_id' => ['sometimes', 'required', 'exists:programs,id', function ($attribute, $value, $fail) use ($request) {
                $departmentId = $request->input('department_id');
                $program = Program::find($value);

                if ($departmentId && $program && (int) $program->department_id !== (int) $departmentId) {
                    $fail('The selected program must belong to the selected department.');
                }
            }],
            'student_type_id' => 'sometimes|required|exists:student_types,id',
            'academic_advisor_id' => 'nullable|exists:users,id',
            'academic_year' => 'sometimes|required|string|max:20',
            'admission_year' => 'sometimes|required|integer|min:1990|max:' . (date('Y') + 1),
            'phone' => 'nullable|string|max:20',
            'status' => 'sometimes|in:active,inactive,graduated,suspended',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $studentData = $request->only([
                'first_name', 'middle_name', 'last_name',
                'college_id', 'department_id', 'program_id',
                'student_type_id', 'academic_advisor_id',
                'academic_year', 'admission_year', 'phone', 'status',
            ]);

            $student->update($studentData);

            // Sync user name if first/last name changed
            if ($request->filled('first_name') || $request->filled('last_name')) {
                $student->user->update([
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'department_id' => $student->department_id,
                ]);
            }

            AuditLogService::log(
                'student_updated',
                "Student updated: {$student->student_id}",
                'App\Models\Student',
                $student->id,
                $studentData
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Student updated successfully',
                'data' => new StudentResource($student->fresh(['user', 'department.college', 'program', 'studentType'])),
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update student: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a student (and linked user account)
     */
    public function deleteStudent($id)
    {
        $student = Student::findOrFail($id);

        DB::beginTransaction();
        try {
            $studentId = $student->student_id;
            $studentName = $student->first_name . ' ' . $student->last_name;

            // Check for active clearance requests
            $activeClearance = ClearanceRequest::where('student_id', $id)
                ->whereIn('status', ['draft', 'submitted', 'in_progress'])
                ->exists();

            if ($activeClearance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete student with active clearance requests. Please complete or cancel the clearance first.',
                ], 422);
            }

            $user = $student->user;
            $student->delete();
            if ($user) {
                $user->delete();
            }

            AuditLogService::log(
                'student_deleted',
                "Student deleted: {$studentId} ({$studentName})",
                'App\Models\Student',
                $id
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Student deleted successfully',
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete student: ' . $e->getMessage(),
            ], 500);
        }
    }
}

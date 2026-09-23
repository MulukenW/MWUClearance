<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\EthiopianCalendar;
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
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use App\Services\AuditLogService;
use Exception;

class AdminController extends Controller
{
    /**
     * Resolve a student type code based on the student ID prefix.
     * UG  = undergraduate:  UGR → regular, UGE → extension, UGS → summer, UGW → winter
     * MSc = postgraduate:   MScR → regular, MScE → extension, MScS → summer, MScW → winter
     */
    protected static function resolveStudentTypeCode(string $studentId): ?string
    {
        if (empty($studentId)) {
            return null;
        }

        $id = strtoupper(trim($studentId));

        if (str_starts_with($id, 'MSC')) {
            $suffix = strlen($id) > 3 ? $id[3] : '';
            $map = ['R' => 'regular', 'E' => 'extension', 'S' => 'summer', 'W' => 'winter'];
            return $map[$suffix] ?? null;
        }

        if (str_starts_with($id, 'UG')) {
            $suffix = strlen($id) > 2 ? $id[2] : '';
            $map = ['R' => 'regular', 'E' => 'extension', 'S' => 'summer', 'W' => 'winter'];
            return $map[$suffix] ?? null;
        }

        return null;
    }

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
        $query = User::with(['role', 'department.college', 'college', 'clearanceOffice']);

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
        $user = User::with(['role', 'department.college', 'college', 'clearanceOffice', 'student'])
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
            'college_id' => 'nullable|exists:colleges,id',
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

            // Auto-assign the clearance office matching the role when none was chosen,
            // so officer accounts can always receive workflow items (office code == role code)
            $officeId = $request->input('clearance_office_id');
            if (empty($officeId) && $role && !in_array($role->code, ['admin', 'student'])) {
                $officeId = ClearanceOffice::where('code', $role->code)->value('id');
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => $role->id,
                'department_id' => $request->department_id,
                'college_id' => $request->college_id,
                'clearance_office_id' => $officeId,
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
                'data' => new UserResource($user->load('role', 'department', 'college', 'clearanceOffice')),
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
            'college_id' => 'nullable|exists:colleges,id',
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
            $userData = $request->only(['name', 'email', 'department_id', 'college_id', 'clearance_office_id', 'status']);

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

            // Auto-assign the clearance office matching the role if the user still has none
            if (empty($userData['clearance_office_id']) && $user->clearance_office_id === null) {
                $roleCode = isset($role) ? $role->code : $user->role->code;
                if ($roleCode && !in_array($roleCode, ['admin', 'student'])) {
                    $officeId = ClearanceOffice::where('code', $roleCode)->value('id');
                    if ($officeId) {
                        $userData['clearance_office_id'] = $officeId;
                    }
                }
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
                $request->only(['name', 'email', 'role_code', 'department_id', 'college_id', 'status'])
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
            'student_type_id' => 'nullable|exists:student_types,id',
            'academic_advisor_id' => 'nullable|exists:users,id',
            'academic_year' => 'nullable|string|max:20',
            // Ethiopian-calendar years are small (e.g. 2019) — accept 1990..EC current+1
            'admission_year' => 'nullable|integer|min:1990|max:' . (EthiopianCalendar::currentYear() + 1),
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

            // Resolve student_type_id from student_id prefix if not explicitly provided
            $studentTypeId = $request->student_type_id;
            if (empty($studentTypeId)) {
                $typeCode = self::resolveStudentTypeCode($request->student_id);
                if ($typeCode) {
                    $studentTypeId = StudentType::where('code', $typeCode)->value('id');
                }
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
                'must_change_password' => $generatedPassword !== null,
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
                 'student_type_id' => $studentTypeId,
                'academic_advisor_id' => $request->academic_advisor_id,
                'academic_year' => EthiopianCalendar::normalizeAcademicYearString($request->academic_year) ?? EthiopianCalendar::academicYear(),
                'admission_year' => EthiopianCalendar::normalizeYear($request->admission_year) ?? EthiopianCalendar::currentYear(),
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
                    'message' => 'Login credentials have been automatically generated. The student will be forced to change their password on first login.',
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
     * Bulk-import students from spreadsheet rows (parsed client-side from CSV/XLSX).
     * Accepts college/department/program/student_type as names or IDs and resolves them,
     * auto-generates passwords, and reports per-row results so partial success is possible.
     */
    public function importStudents(Request $request)
    {
        $request->validate([
            'rows' => 'required|array|max:1000',
            'auto_email' => 'nullable|boolean',
            'auto_create' => 'nullable|boolean',
        ]);

        $rows = $request->input('rows');
        $autoEmail = $request->boolean('auto_email');
        $autoCreate = $request->boolean('auto_create');

        if (empty($rows)) {
            return response()->json([
                'success' => false,
                'message' => 'No data rows found in the uploaded file.',
            ], 422);
        }

        // ---- Normalizer: NBSP -> space, lowercase, collapse whitespace, strip
        // "Department of " / "College of " style prefixes and punctuation, and expand
        // common degree abbreviations, so spreadsheet values like "BSc in Computer
        // Science" or "Dept. of Computer Science" match the canonical DB names ----
        $normName = function ($v) {
            $s = strtolower(trim(preg_replace('/[\s\x{00A0}]+/u', ' ', (string) $v)));
            $s = preg_replace('/^(department|dept|college|school|faculty|program|programme)s?\s+(of|in)\s+/', '', $s);
            $s = preg_replace('/\s+(program|programme|department|dept)$/', '', $s);
            $s = preg_replace('/[^a-z0-9 ]+/', ' ', $s);
            $s = preg_replace('/\s+/', ' ', trim($s));
            // Degree abbreviations -> full words (word-bounded)
            $abbrev = [
                '/\bbsc\b/' => 'bachelor of science',
                '/\bbs\b/' => 'bachelor of science',
                '/\bmsc\b/' => 'master of science',
                '/\bms\b/' => 'master of science',
                '/\bba\b/' => 'bachelor of arts',
                '/\bma\b/' => 'master of arts',
                '/\bphd\b/' => 'doctor of philosophy',
                '/\bllb\b/' => 'bachelor of laws',
                '/\bbed\b/' => 'bachelor of education',
                '/\bmed\b/' => 'master of education',
            ];
            return trim(preg_replace(array_keys($abbrev), array_values($abbrev), $s));
        };

        // ---- Reference lists with pre-normalized names (fast per-row matching) ----
        $collegeList = [];
        foreach (College::all() as $c) {
            $collegeList[] = ['id' => (int) $c->id, 'name' => $c->name, 'norm' => $normName($c->name)];
        }
        $deptList = [];
        foreach (Department::all() as $d) {
            $deptList[] = ['id' => (int) $d->id, 'college_id' => (int) $d->college_id, 'name' => $d->name, 'norm' => $normName($d->name)];
        }
        $progList = [];
        foreach (Program::all() as $p) {
            $progList[] = ['id' => (int) $p->id, 'department_id' => (int) $p->department_id, 'name' => $p->name, 'norm' => $normName($p->name)];
        }
        $typeList = [];
        foreach (StudentType::all() as $t) {
            $typeList[] = ['id' => (int) $t->id, 'name' => $t->name, 'norm' => $normName($t->name)];
        }

        // Resolution: exact normalized match first, then containment either direction,
        // then typo tolerance (>= 85% similar). Containment picks the shortest matching
        // DB name (most specific) to avoid broad words matching everything.
        $resolveByName = function ($value, array $list) use ($normName) {
            $needle = $normName($value);
            if ($needle === '') return null;
            foreach ($list as $item) {
                if ($item['norm'] === $needle) return (int) $item['id'];
            }
            $best = null;
            $bestLen = PHP_INT_MAX;
            foreach ($list as $item) {
                if ($item['norm'] === '') continue;
                if (strpos($item['norm'], $needle) !== false || strpos($needle, $item['norm']) !== false) {
                    if (strlen($item['norm']) < $bestLen) {
                        $bestLen = strlen($item['norm']);
                        $best = (int) $item['id'];
                    }
                }
            }
            if ($best !== null) return $best;
            $bestScore = 0.0;
            foreach ($list as $item) {
                if ($item['norm'] === '' || strlen($item['norm']) < 4) continue;
                $maxLen = max(strlen($item['norm']), strlen($needle));
                if ($maxLen === 0) continue;
                $score = 1 - (levenshtein($item['norm'], $needle) / $maxLen);
                if ($score >= 0.85 && $score > $bestScore) {
                    $bestScore = $score;
                    $best = (int) $item['id'];
                }
            }
            return $best;
        };

        $studentRole = Role::where('code', 'student')->first();
        if (!$studentRole) {
            return response()->json([
                'success' => false,
                'message' => 'Student role not found in the system. Run the role seeder.',
            ], 500);
        }

        // Unique code generator for auto-created reference rows (code is NOT NULL UNIQUE)
        $makeCode = function ($prefix, $table) {
            do {
                $code = $prefix . '-' . strtoupper(substr(md5(uniqid('', true)), 0, 8));
            } while (DB::table($table)->where('code', $code)->exists());
            return $code;
        };

        $seenEmails = [];
        $seenStudentIds = [];
        $results = [];
        $imported = 0;
        $failed = 0;

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2; // +2: header row is row 1, data starts at row 2
            $errors = [];

            $studentId = trim((string) ($row['student_id'] ?? ''));
            $firstName = trim((string) ($row['first_name'] ?? ''));
            $middleName = trim((string) ($row['middle_name'] ?? ''));
            $lastName = trim((string) ($row['last_name'] ?? ''));

            // Single "Full Name" column: split into first / middle / last
            if ($firstName === '' && $lastName === '') {
                $fullNameRaw = trim((string) ($row['full_name'] ?? ''));
                if ($fullNameRaw !== '') {
                    $parts = preg_split('/\s+/', $fullNameRaw);
                    $firstName = array_shift($parts);
                    $lastName = count($parts) ? array_pop($parts) : $firstName;
                    $middleName = trim(implode(' ', $parts));
                }
            }
            $email = strtolower(trim((string) ($row['email'] ?? '')));
            $emailWasEmpty = $email === '';
            $phone = trim((string) ($row['phone'] ?? '')) ?: null;
            $academicYear = EthiopianCalendar::normalizeAcademicYearString($row['academic_year'] ?? null) ?: EthiopianCalendar::academicYear();

            // Accept "2026", "2026/27", "2026-2027", or text containing a year: take the first 4-digit number
            $admissionRaw = trim((string) ($row['admission_year'] ?? ''));
            $admissionYear = EthiopianCalendar::currentYear();
            if ($admissionRaw !== '' && preg_match('/(19|20)\d{2}/', $admissionRaw, $m)) {
                $admissionYear = EthiopianCalendar::normalizeYear((int) $m[0]) ?? EthiopianCalendar::currentYear();
            }

            // ---- Required-field checks ----
            if ($studentId === '') $errors[] = 'Student ID is required';
            if ($firstName === '') $errors[] = 'First name is required';
            if ($lastName === '') $errors[] = 'Last name is required';
            if ($email === '' && !$autoEmail) {
                $errors[] = 'Email is required (or enable auto-generate missing emails)';
            } elseif ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Email '$email' is not valid";
            }
            if ((int) $admissionYear < 1990 || (int) $admissionYear > (int) date('Y') + 1) {
                $errors[] = "Admission year '$admissionRaw' could not be read as a year between 1990 and " . (date('Y') + 1);
            }

            // ---- Resolve college / department / program / student type ----
            $collegeId = null;
            $departmentId = null;
            $programId = null;
            $typeId = null;

            $collegeKey = trim((string) ($row['college'] ?? ''));
            if ($collegeKey !== '') {
                $collegeId = null;
                if (ctype_digit($collegeKey)) {
                    foreach ($collegeList as $c) {
                        if ($c['id'] == $collegeKey) { $collegeId = $c['id']; break; }
                    }
                }
                if ($collegeId === null) $collegeId = $resolveByName($collegeKey, $collegeList);
                if ($collegeId === null) $errors[] = "College '$collegeKey' not found";
            } else {
                $errors[] = 'College is required';
            }

            $deptKey = trim((string) ($row['department'] ?? ''));
            if ($deptKey !== '') {
                $deptId = null;
                if (ctype_digit($deptKey)) {
                    foreach ($deptList as $d) {
                        if ($d['id'] == $deptKey) { $deptId = $d['id']; break; }
                    }
                }
                // Prefer departments inside the resolved college; a same-name department
                // in another college is a likely false match, not a real one.
                if ($deptId === null && $collegeId !== null) {
                    $scoped = [];
                    foreach ($deptList as $d) {
                        if ($d['college_id'] === $collegeId) $scoped[] = $d;
                    }
                    $deptId = $resolveByName($deptKey, $scoped);
                }
                if ($deptId === null && !$autoCreate) {
                    // Only fall back to other colleges when we cannot create a proper one
                    $deptId = $resolveByName($deptKey, $deptList);
                }
                if ($deptId === null && $autoCreate && $collegeId !== null) {
                    // Create the missing department under the resolved college
                    $newDept = Department::create(['name' => $deptKey, 'college_id' => $collegeId, 'code' => $makeCode('DEP', 'departments')]);
                    $newEntry = ['id' => (int) $newDept->id, 'college_id' => $collegeId, 'name' => $newDept->name, 'norm' => $normName($newDept->name)];
                    $deptList[] = $newEntry;
                    $deptId = $newEntry['id'];
                }
                if ($deptId === null) {
                    $errors[] = "Department '$deptKey' not found";
                } else {
                    $owner = null;
                    foreach ($deptList as $d) {
                        if ($d['id'] === $deptId) { $owner = $d; break; }
                    }
                    if ($owner && ($collegeId === null || $owner['college_id'] === $collegeId)) {
                        $departmentId = $deptId;
                    } else {
                        $errors[] = "Department '$deptKey' does not belong to the selected college";
                    }
                }
            } else {
                $errors[] = 'Department is required';
            }

            $progKey = trim((string) ($row['program'] ?? ''));
            $typeKey = trim((string) ($row['student_type'] ?? ''));

            // Rosters often put admission types (Regular/Extension) in the Program column
            // (or programs in the Student Type column). Swap when the value clearly
            // belongs to the other field.
            if ($progKey !== '' && $typeKey === '') {
                $isType = $resolveByName($progKey, $typeList) !== null;
                $isProg = $resolveByName($progKey, $progList) !== null;
                if ($isType && !$isProg) {
                    $typeKey = $progKey;
                    $progKey = '';
                }
            } elseif ($typeKey !== '' && $progKey === '') {
                $isProg = $resolveByName($typeKey, $progList) !== null;
                $isType = $resolveByName($typeKey, $typeList) !== null;
                if ($isProg && !$isType) {
                    $progKey = $typeKey;
                    $typeKey = '';
                }
            }

            $progId = null;
            if ($progKey !== '') {
                if (ctype_digit($progKey)) {
                    foreach ($progList as $p) {
                        if ($p['id'] == $progKey) { $progId = $p['id']; break; }
                    }
                }
                if ($progId === null) $progId = $resolveByName($progKey, $progList);
                // Fallback: the value is really a department name — if that department
                // offers exactly one program, use it.
                if ($progId === null) {
                    $matchedDept = $resolveByName($progKey, $deptList);
                    if ($matchedDept !== null) {
                        $deptPrograms = [];
                        foreach ($progList as $p) {
                            if ($p['department_id'] === $matchedDept) $deptPrograms[] = $p['id'];
                        }
                        if (count($deptPrograms) === 1) $progId = $deptPrograms[0];
                    }
                }
            }
            // No Program column: derive it from the department — its single program, or
            // its Bachelor's (undergraduate) program when several exist, so spreadsheets
            // without a Program column still import. (Provided-but-unresolvable stays an error.)
            if ($progId === null && $progKey === '' && $departmentId !== null) {
                $deptPrograms = [];
                foreach ($progList as $p) {
                    if ($p['department_id'] === $departmentId) $deptPrograms[] = $p;
                }
                if (count($deptPrograms) === 1) {
                    $progId = $deptPrograms[0]['id'];
                } elseif (count($deptPrograms) > 1) {
                    $bachelor = null;
                    foreach ($deptPrograms as $p) {
                        if (strpos($p['norm'], 'bachelor') === 0) { $bachelor = $p; break; }
                    }
                    $progId = ($bachelor ?? $deptPrograms[0])['id'];
                } elseif ($autoCreate) {
                    // Freshly created department with no programs: give it a program
                    // named after the department so the rows can import (rename later in Admin).
                    $owner = null;
                    foreach ($deptList as $d) {
                        if ($d['id'] === $departmentId) { $owner = $d; break; }
                    }
                    $newProg = Program::create(['name' => $owner['name'], 'department_id' => $departmentId, 'code' => $makeCode('PRG', 'programs')]);
                    $newEntry = ['id' => (int) $newProg->id, 'department_id' => $departmentId, 'name' => $newProg->name, 'norm' => $normName($newProg->name)];
                    $progList[] = $newEntry;
                    $progId = $newEntry['id'];
                }
            }
            // Unknown program value with auto-create: add it under the row's department
            if ($progId === null && $autoCreate && $departmentId !== null && $progKey !== '') {
                $newProg = Program::create(['name' => $progKey, 'department_id' => $departmentId, 'code' => $makeCode('PRG', 'programs')]);
                $newEntry = ['id' => (int) $newProg->id, 'department_id' => $departmentId, 'name' => $newProg->name, 'norm' => $normName($newProg->name)];
                $progList[] = $newEntry;
                $progId = $newEntry['id'];
            }
            if ($progId !== null) {
                if ($departmentId !== null) {
                    $owner = null;
                    foreach ($progList as $p) {
                        if ($p['id'] === $progId) { $owner = $p; break; }
                    }
                    if ($owner && $owner['department_id'] === $departmentId) {
                        $programId = $progId;
                    } else {
                        $errors[] = "Program '$progKey' does not belong to the selected department";
                    }
                }
            } else {
                $errors[] = $progKey === ''
                    ? 'Program is required (this department has multiple programs — add a Program column to the file)'
                    : "Program '$progKey' not found";
            }

            if ($typeKey !== '') {
                $typeId = null;
                if (ctype_digit($typeKey)) {
                    foreach ($typeList as $t) {
                        if ($t['id'] == $typeKey) { $typeId = $t['id']; break; }
                    }
                }
                if ($typeId === null) $typeId = $resolveByName($typeKey, $typeList);
                if ($typeId === null && $autoCreate) {
                    $newType = StudentType::create(['name' => $typeKey, 'code' => $makeCode('STY', 'student_types')]);
                    $typeList[] = ['id' => (int) $newType->id, 'name' => $newType->name, 'norm' => $normName($newType->name)];
                    $typeId = (int) $newType->id;
                }
                if ($typeId === null) $errors[] = "Student type '$typeKey' not found";
            } else {
                // Auto-resolve student type from student_id prefix when not in the file
                $typeCode = self::resolveStudentTypeCode($studentId);
                if ($typeCode) {
                    $typeId = StudentType::where('code', $typeCode)->value('id');
                }
                if ($typeId === null) {
                    $errors[] = 'Student type is required (not found in file and could not be resolved from Student ID prefix)';
                }
            }

            // ---- Duplicates inside the file ----
            if ($email !== '' && isset($seenEmails[$email])) {
                $errors[] = "Duplicate email '$email' in the file";
            }
            if ($studentId !== '' && isset($seenStudentIds[$studentId])) {
                $errors[] = "Duplicate Student ID '$studentId' in the file";
            }

            // ---- Duplicates against the database ----
            if ($email !== '' && User::where('email', $email)->exists()) {
                $errors[] = "A user with email '$email' already exists";
            }
            if ($studentId !== '' && Student::where('student_id', $studentId)->exists()) {
                $errors[] = "A student with ID '$studentId' already exists";
            }

            if (!empty($errors)) {
                $failed++;
                $results[] = [
                    'row' => $rowNumber,
                    'status' => 'failed',
                    'student_id' => $studentId,
                    'email' => $email,
                    'name' => trim($firstName . ' ' . $lastName),
                    'errors' => $errors,
                ];
                $seenEmails[$email] = true;
                $seenStudentIds[$studentId] = true;
                continue;
            }

            $seenEmails[$email] = true;
            $seenStudentIds[$studentId] = true;

            // ---- Create user + student (per-row transaction: good rows survive bad ones) ----
            DB::beginTransaction();
            try {
                // Auto-generate a unique email from the Student ID when the file has none
                if ($emailWasEmpty) {
                    $slug = trim(preg_replace('/[^a-z0-9]+/', '.', strtolower($studentId)), '.');
                    $candidate = 'std.' . $slug . '@student.mwu.edu.et';
                    $suffix = 1;
                    while (User::where('email', $candidate)->exists()) {
                        $candidate = 'std.' . $slug . '.' . (++$suffix) . '@student.mwu.edu.et';
                    }
                    $email = $candidate;
                }

                $generatedPassword = strtoupper(substr($firstName, 0, 1)) . $studentId . rand(100, 999);

                $user = User::create([
                    'name' => $firstName . ' ' . $lastName,
                    'email' => $email,
                    'password' => Hash::make($generatedPassword),
                    'role_id' => $studentRole->id,
                    'department_id' => $departmentId,
                    'status' => 'active',
                    'must_change_password' => true,
                ]);

                $student = Student::create([
                    'user_id' => $user->id,
                    'student_id' => $studentId,
                    'first_name' => $firstName,
                    'middle_name' => $middleName ?: null,
                    'last_name' => $lastName,
                    'college_id' => $collegeId,
                    'department_id' => $departmentId,
                    'program_id' => $programId,
                    'student_type_id' => $typeId,
                    'academic_year' => $academicYear,
                    'admission_year' => (int) $admissionYear,
                    'phone' => $phone,
                    'email' => $email,
                    'status' => 'active',
                ]);

                AuditLogService::log(
                    'student_imported',
                    "Student imported: {$student->student_id} ({$student->first_name} {$student->last_name})",
                    'App\\Models\\Student',
                    $student->id,
                    ['student_id' => $student->student_id, 'department_id' => $student->department_id]
                );

                DB::commit();
                $imported++;
                $results[] = [
                    'row' => $rowNumber,
                    'status' => 'imported',
                    'student_id' => $studentId,
                    'email' => $email,
                    'name' => trim($firstName . ' ' . $lastName),
                    'password' => $generatedPassword,
                    'email_generated' => $emailWasEmpty,
                ];
            } catch (Exception $e) {
                DB::rollBack();
                $failed++;
                $results[] = [
                    'row' => $rowNumber,
                    'status' => 'failed',
                    'student_id' => $studentId,
                    'email' => $email,
                    'name' => trim($firstName . ' ' . $lastName),
                    'errors' => ['Database error: ' . $e->getMessage()],
                ];
            }
        }

        AuditLogService::log(
            'students_bulk_imported',
            "Bulk student import: $imported imported, $failed failed",
            'App\\Models\\Student',
            null,
            ['imported' => $imported, 'failed' => $failed]
        );

        return response()->json([
            'success' => true,
            'message' => "Import finished: $imported imported, $failed failed.",
            'imported' => $imported,
            'failed' => $failed,
            'results' => $results,
        ]);
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
            // Ethiopian-calendar years are small — accept 1990..EC current+1
            'admission_year' => 'sometimes|required|integer|min:1990|max:' . (EthiopianCalendar::currentYear() + 1),
            'phone' => 'nullable|string|max:20',
            'status' => 'sometimes|in:active,inactive,graduated,suspended',
            'email' => ['sometimes', 'nullable', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($student->user_id)],
            'student_id' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('students', 'student_id')->ignore($student->id)],
            'password' => 'nullable|string|min:8',
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

            // Years are stored in the Ethiopian calendar — normalize legacy
            // Gregorian input (e.g. 2026 → 2019 EC) on every update.
            if (array_key_exists('academic_year', $studentData) && $studentData['academic_year'] !== null) {
                $studentData['academic_year'] = EthiopianCalendar::normalizeAcademicYearString($studentData['academic_year']);
            }
            if (array_key_exists('admission_year', $studentData) && $studentData['admission_year'] !== null) {
                $normalized = EthiopianCalendar::normalizeYear($studentData['admission_year']);
                if ($normalized !== null) {
                    $studentData['admission_year'] = $normalized;
                }
            }

            // Student ID change (unique on students table)
            if ($request->filled('student_id') && $request->student_id !== $student->student_id) {
                $studentData['student_id'] = $request->student_id;
            }

            $student->update($studentData);

            // Sync the linked user account (name, email, department, password)
            $userSync = [];
            if ($request->filled('first_name') || $request->filled('last_name')) {
                $userSync['name'] = trim($student->first_name . ' ' . ($student->middle_name ? $student->middle_name . ' ' : '') . $student->last_name);
            }
            if ($request->filled('email')) {
                $userSync['email'] = $request->input('email');
                $student->update(['email' => $request->input('email')]);
            }
            if ($request->filled('department_id')) {
                $userSync['department_id'] = $student->department_id;
            }
            if ($request->filled('password')) {
                $userSync['password'] = Hash::make($request->input('password'));
            }
            if (!empty($userSync)) {
                $student->user->update($userSync);
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

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\College;
use App\Models\Department;
use App\Models\Program;
use App\Models\StudentType;
use App\Models\ClearanceOffice;
use App\Models\Student;
use App\Models\User;
use App\Models\ClearanceWorkflowStep;
use App\Http\Resources\CollegeResource;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\ProgramResource;
use App\Http\Resources\StudentTypeResource;
use App\Http\Resources\ClearanceOfficeResource;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class AdminManagementController extends Controller
{
    // ========================================================================
    // COLLEGES
    // ========================================================================

    public function colleges(Request $request)
    {
        $query = College::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === '1');
        }

        $colleges = $query->withCount('departments')->orderBy('name')->paginate($request->get('per_page', 100));

        return response()->json([
            'success' => true,
            'data' => CollegeResource::collection($colleges),
            'meta' => [
                'current_page' => $colleges->currentPage(),
                'last_page' => $colleges->lastPage(),
                'per_page' => $colleges->perPage(),
                'total' => $colleges->total(),
            ],
        ]);
    }

    public function getCollege($id)
    {
        $college = College::withCount('departments')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new CollegeResource($college),
        ]);
    }

    public function createCollege(Request $request)
    {
        $validator = $this->validateCollege($request);
        if ($validator) {
            return $validator;
        }

        $college = College::create($request->only(['name', 'code', 'description', 'is_active']));

        AuditLogService::log('college_created', "College created: {$college->name}", 'App\Models\College', $college->id);

        return response()->json([
            'success' => true,
            'message' => 'College created successfully',
            'data' => new CollegeResource($college),
        ], 201);
    }

    public function updateCollege(Request $request, $id)
    {
        $college = College::findOrFail($id);

        $validator = $this->validateCollege($request, $id);
        if ($validator) {
            return $validator;
        }

        $college->update($request->only(['name', 'code', 'description', 'is_active']));

        AuditLogService::log('college_updated', "College updated: {$college->name}", 'App\Models\College', $college->id);

        return response()->json([
            'success' => true,
            'message' => 'College updated successfully',
            'data' => new CollegeResource($college->fresh()),
        ]);
    }

    public function deleteCollege($id)
    {
        $college = College::withCount('departments')->findOrFail($id);

        if ($college->departments_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete college with existing departments. Deactivate the departments first.',
            ], 422);
        }

        $name = $college->name;
        $college->delete();

        AuditLogService::log('college_deleted', "College deleted: {$name}", 'App\Models\College', $id);

        return response()->json([
            'success' => true,
            'message' => 'College deleted successfully',
        ]);
    }

    public function toggleCollegeActive($id)
    {
        $college = College::findOrFail($id);
        $college->update(['is_active' => !$college->is_active]);

        AuditLogService::log(
            'college_toggled',
            "College {$college->name} " . ($college->is_active ? 'activated' : 'deactivated'),
            'App\Models\College',
            $college->id
        );

        return response()->json([
            'success' => true,
            'message' => "College " . ($college->is_active ? 'activated' : 'deactivated') . " successfully",
            'data' => new CollegeResource($college),
        ]);
    }

    // ========================================================================
    // DEPARTMENTS
    // ========================================================================

    public function departments(Request $request)
    {
        $query = Department::with('college:id,name,code');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('college_id')) {
            $query->where('college_id', $request->college_id);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === '1');
        }

        $departments = $query->withCount('students')->orderBy('name')->paginate($request->get('per_page', 100));

        return response()->json([
            'success' => true,
            'data' => DepartmentResource::collection($departments),
            'meta' => [
                'current_page' => $departments->currentPage(),
                'last_page' => $departments->lastPage(),
                'per_page' => $departments->perPage(),
                'total' => $departments->total(),
            ],
        ]);
    }

    public function getDepartment($id)
    {
        $department = Department::with('college:id,name,code')->withCount('students')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new DepartmentResource($department),
        ]);
    }

    public function createDepartment(Request $request)
    {
        $validator = $this->validateDepartment($request);
        if ($validator) {
            return $validator;
        }

        $department = Department::create($request->only(['college_id', 'name', 'code', 'description', 'is_active']));

        AuditLogService::log('department_created', "Department created: {$department->name}", 'App\Models\Department', $department->id);

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully',
            'data' => new DepartmentResource($department->load('college:id,name,code')),
        ], 201);
    }

    public function updateDepartment(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validator = $this->validateDepartment($request, $id);
        if ($validator) {
            return $validator;
        }

        $department->update($request->only(['college_id', 'name', 'code', 'description', 'is_active']));

        AuditLogService::log('department_updated', "Department updated: {$department->name}", 'App\Models\Department', $department->id);

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully',
            'data' => new DepartmentResource($department->fresh('college:id,name,code')),
        ]);
    }

    public function deleteDepartment($id)
    {
        $department = Department::withCount('students')->findOrFail($id);

        if ($department->students_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete department with existing students. Reassign students first.',
            ], 422);
        }

        $name = $department->name;
        $department->delete();

        AuditLogService::log('department_deleted', "Department deleted: {$name}", 'App\Models\Department', $id);

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully',
        ]);
    }

    public function toggleDepartmentActive($id)
    {
        $department = Department::findOrFail($id);
        $department->update(['is_active' => !$department->is_active]);

        AuditLogService::log(
            'department_toggled',
            "Department {$department->name} " . ($department->is_active ? 'activated' : 'deactivated'),
            'App\Models\Department',
            $department->id
        );

        return response()->json([
            'success' => true,
            'message' => "Department " . ($department->is_active ? 'activated' : 'deactivated') . " successfully",
            'data' => new DepartmentResource($department->load('college:id,name,code')),
        ]);
    }

    // ========================================================================
    // PROGRAMS
    // ========================================================================

    public function programs(Request $request)
    {
        $query = Program::with('department:id,name,code');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->filled('level')) {
            $query->where('level', $request->level);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === '1');
        }

        $programs = $query->orderBy('name')->paginate($request->get('per_page', 100));

        return response()->json([
            'success' => true,
            'data' => ProgramResource::collection($programs),
            'meta' => [
                'current_page' => $programs->currentPage(),
                'last_page' => $programs->lastPage(),
                'per_page' => $programs->perPage(),
                'total' => $programs->total(),
            ],
        ]);
    }

    public function getProgram($id)
    {
        $program = Program::with('department:id,name,code')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new ProgramResource($program),
        ]);
    }

    public function createProgram(Request $request)
    {
        $validator = $this->validateProgram($request);
        if ($validator) {
            return $validator;
        }

        $program = Program::create($request->only(['department_id', 'name', 'code', 'description', 'level', 'is_active', 'duration_years']));

        AuditLogService::log('program_created', "Program created: {$program->name}", 'App\Models\Program', $program->id);

        return response()->json([
            'success' => true,
            'message' => 'Program created successfully',
            'data' => new ProgramResource($program->load('department:id,name,code')),
        ], 201);
    }

    public function updateProgram(Request $request, $id)
    {
        $program = Program::findOrFail($id);

        $validator = $this->validateProgram($request, $id);
        if ($validator) {
            return $validator;
        }

        $program->update($request->only(['department_id', 'name', 'code', 'description', 'level', 'is_active', 'duration_years']));

        AuditLogService::log('program_updated', "Program updated: {$program->name}", 'App\Models\Program', $program->id);

        return response()->json([
            'success' => true,
            'message' => 'Program updated successfully',
            'data' => new ProgramResource($program->fresh('department:id,name,code')),
        ]);
    }

    public function deleteProgram($id)
    {
        $program = Program::withCount('students')->findOrFail($id);

        if ($program->students_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete program with existing students. Reassign students first.',
            ], 422);
        }

        $name = $program->name;
        $program->delete();

        AuditLogService::log('program_deleted', "Program deleted: {$name}", 'App\Models\Program', $id);

        return response()->json([
            'success' => true,
            'message' => 'Program deleted successfully',
        ]);
    }

    public function toggleProgramActive($id)
    {
        $program = Program::findOrFail($id);
        $program->update(['is_active' => !$program->is_active]);

        AuditLogService::log(
            'program_toggled',
            "Program {$program->name} " . ($program->is_active ? 'activated' : 'deactivated'),
            'App\Models\Program',
            $program->id
        );

        return response()->json([
            'success' => true,
            'message' => "Program " . ($program->is_active ? 'activated' : 'deactivated') . " successfully",
            'data' => new ProgramResource($program->load('department:id,name,code')),
        ]);
    }

    // ========================================================================
    // STUDENT TYPES
    // ========================================================================

    public function studentTypes(Request $request)
    {
        $query = StudentType::query();

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === '1');
        }

        $types = $query->withCount('students')->orderBy('name')->paginate($request->get('per_page', 100));

        return response()->json([
            'success' => true,
            'data' => StudentTypeResource::collection($types),
            'meta' => [
                'current_page' => $types->currentPage(),
                'last_page' => $types->lastPage(),
                'per_page' => $types->perPage(),
                'total' => $types->total(),
            ],
        ]);
    }

    public function getStudentType($id)
    {
        $type = StudentType::withCount('students')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new StudentTypeResource($type),
        ]);
    }

    public function createStudentType(Request $request)
    {
        $validator = $this->validateStudentType($request);
        if ($validator) {
            return $validator;
        }

        $type = StudentType::create($request->only(['name', 'code', 'description', 'is_active']));

        AuditLogService::log('student_type_created', "Student type created: {$type->name}", 'App\Models\StudentType', $type->id);

        return response()->json([
            'success' => true,
            'message' => 'Student type created successfully',
            'data' => new StudentTypeResource($type),
        ], 201);
    }

    public function updateStudentType(Request $request, $id)
    {
        $type = StudentType::findOrFail($id);

        $validator = $this->validateStudentType($request, $id);
        if ($validator) {
            return $validator;
        }

        $type->update($request->only(['name', 'code', 'description', 'is_active']));

        AuditLogService::log('student_type_updated', "Student type updated: {$type->name}", 'App\Models\StudentType', $type->id);

        return response()->json([
            'success' => true,
            'message' => 'Student type updated successfully',
            'data' => new StudentTypeResource($type->fresh()),
        ]);
    }

    public function deleteStudentType($id)
    {
        $type = StudentType::withCount('students')->findOrFail($id);

        if ($type->students_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete student type with existing students. Reassign students first.',
            ], 422);
        }

        // Check for workflow steps
        $workflowCount = ClearanceWorkflowStep::where('student_type_id', $id)->count();
        if ($workflowCount > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete student type with configured workflow steps. Remove workflow configuration first.',
            ], 422);
        }

        $name = $type->name;
        $type->delete();

        AuditLogService::log('student_type_deleted', "Student type deleted: {$name}", 'App\Models\StudentType', $id);

        return response()->json([
            'success' => true,
            'message' => 'Student type deleted successfully',
        ]);
    }

    public function toggleStudentTypeActive($id)
    {
        $type = StudentType::findOrFail($id);
        $type->update(['is_active' => !$type->is_active]);

        AuditLogService::log(
            'student_type_toggled',
            "Student type {$type->name} " . ($type->is_active ? 'activated' : 'deactivated'),
            'App\Models\StudentType',
            $type->id
        );

        return response()->json([
            'success' => true,
            'message' => "Student type " . ($type->is_active ? 'activated' : 'deactivated') . " successfully",
            'data' => new StudentTypeResource($type),
        ]);
    }

    // ========================================================================
    // CLEARANCE OFFICES
    // ========================================================================

    public function clearanceOffices(Request $request)
    {
        $query = ClearanceOffice::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === '1');
        }

        $offices = $query->orderBy('id')->paginate($request->get('per_page', 100));

        return response()->json([
            'success' => true,
            'data' => ClearanceOfficeResource::collection($offices),
            'meta' => [
                'current_page' => $offices->currentPage(),
                'last_page' => $offices->lastPage(),
                'per_page' => $offices->perPage(),
                'total' => $offices->total(),
            ],
        ]);
    }

    public function getClearanceOffice($id)
    {
        $office = ClearanceOffice::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new ClearanceOfficeResource($office),
        ]);
    }

    public function createClearanceOffice(Request $request)
    {
        $validator = $this->validateClearanceOffice($request);
        if ($validator) {
            return $validator;
        }

        $office = ClearanceOffice::create($request->only(['name', 'code', 'description', 'is_active']));

        AuditLogService::log('clearance_office_created', "Clearance office created: {$office->name}", 'App\Models\ClearanceOffice', $office->id);

        return response()->json([
            'success' => true,
            'message' => 'Clearance office created successfully',
            'data' => new ClearanceOfficeResource($office),
        ], 201);
    }

    public function updateClearanceOffice(Request $request, $id)
    {
        $office = ClearanceOffice::findOrFail($id);

        $validator = $this->validateClearanceOffice($request, $id);
        if ($validator) {
            return $validator;
        }

        $office->update($request->only(['name', 'code', 'description', 'is_active']));

        AuditLogService::log('clearance_office_updated', "Clearance office updated: {$office->name}", 'App\Models\ClearanceOffice', $office->id);

        return response()->json([
            'success' => true,
            'message' => 'Clearance office updated successfully',
            'data' => new ClearanceOfficeResource($office->fresh()),
        ]);
    }

    public function deleteClearanceOffice($id)
    {
        $office = ClearanceOffice::findOrFail($id);

        // Check for workflow steps
        $workflowCount = ClearanceWorkflowStep::where('clearance_office_id', $id)->count();
        if ($workflowCount > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete office with configured workflow steps. Remove workflow configuration first.',
            ], 422);
        }

        // Check for assigned users
        $userCount = User::where('clearance_office_id', $id)->count();
        if ($userCount > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete office with assigned users. Reassign users first.',
            ], 422);
        }

        $name = $office->name;
        $office->delete();

        AuditLogService::log('clearance_office_deleted', "Clearance office deleted: {$name}", 'App\Models\ClearanceOffice', $id);

        return response()->json([
            'success' => true,
            'message' => 'Clearance office deleted successfully',
        ]);
    }

    public function toggleClearanceOfficeActive($id)
    {
        $office = ClearanceOffice::findOrFail($id);
        $office->update(['is_active' => !$office->is_active]);

        AuditLogService::log(
            'clearance_office_toggled',
            "Clearance office {$office->name} " . ($office->is_active ? 'activated' : 'deactivated'),
            'App\Models\ClearanceOffice',
            $office->id
        );

        return response()->json([
            'success' => true,
            'message' => "Clearance office " . ($office->is_active ? 'activated' : 'deactivated') . " successfully",
            'data' => new ClearanceOfficeResource($office),
        ]);
    }

    // ========================================================================
    // VALIDATION HELPERS
    // ========================================================================

    protected function validateCollege(Request $request, $id = null)
    {
        $uniqueName = $id ? 'unique:colleges,name,' . $id : 'unique:colleges,name';
        $uniqueCode = $id ? 'unique:colleges,code,' . $id : 'unique:colleges,code';

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'name' => ($id ? 'sometimes|' : '') . 'required|string|max:255|' . $uniqueName,
            'code' => ($id ? 'sometimes|' : '') . 'required|string|max:20|' . $uniqueCode,
            'description' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        return null;
    }

    protected function validateDepartment(Request $request, $id = null)
    {
        $uniqueName = $id ? 'unique:departments,name,' . $id : 'unique:departments,name';
        $uniqueCode = $id ? 'unique:departments,code,' . $id : 'unique:departments,code';

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'college_id' => ($id ? 'sometimes|' : '') . 'required|exists:colleges,id',
            'name' => ($id ? 'sometimes|' : '') . 'required|string|max:255|' . $uniqueName,
            'code' => ($id ? 'sometimes|' : '') . 'required|string|max:20|' . $uniqueCode,
            'description' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        return null;
    }

    protected function validateProgram(Request $request, $id = null)
    {
        // Determine the department_id to scope the unique name check.
        // For updates, fall back to the existing program's department_id.
        $departmentId = $request->input('department_id');
        if (!$departmentId && $id) {
            $program = Program::find($id);
            $departmentId = $program ? $program->department_id : null;
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'department_id' => ($id ? 'sometimes|' : '') . 'required|exists:departments,id',
            'name' => [
                ($id ? 'sometimes|' : '') . 'required|string|max:255',
                function ($attribute, $value, $fail) use ($id, $departmentId) {
                    $query = Program::where('name', $value);
                    if ($departmentId) {
                        $query->where('department_id', $departmentId);
                    }
                    if ($id) {
                        $query->where('id', '!=', $id);
                    }
                    if ($query->exists()) {
                        $fail('The name has already been given.');
                    }
                },
            ],
            'code' => ($id ? 'sometimes|' : '') . 'required|string|max:20|unique:programs,code' . ($id ? ',' . $id : ''),
            'description' => 'nullable|string|max:1000',
            'level' => 'sometimes|in:undergraduate,postgraduate,graduate,diploma,certificate,phd',
            'duration_years' => 'nullable|integer|min:1|max:10',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        return null;
    }

    protected function validateStudentType(Request $request, $id = null)
    {
        $uniqueName = $id ? 'unique:student_types,name,' . $id : 'unique:student_types,name';
        $uniqueCode = $id ? 'unique:student_types,code,' . $id : 'unique:student_types,code';

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'name' => ($id ? 'sometimes|' : '') . 'required|string|max:255|' . $uniqueName,
            'code' => ($id ? 'sometimes|' : '') . 'required|string|max:50|' . $uniqueCode,
            'description' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        return null;
    }

    protected function validateClearanceOffice(Request $request, $id = null)
    {
        $uniqueName = $id ? 'unique:clearance_offices,name,' . $id : 'unique:clearance_offices,name';
        $uniqueCode = $id ? 'unique:clearance_offices,code,' . $id : 'unique:clearance_offices,code';

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'name' => ($id ? 'sometimes|' : '') . 'required|string|max:255|' . $uniqueName,
            'code' => ($id ? 'sometimes|' : '') . 'required|string|max:50|' . $uniqueCode,
            'description' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        return null;
    }
}

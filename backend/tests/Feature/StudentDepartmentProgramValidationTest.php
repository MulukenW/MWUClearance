<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminWorkflowController;
use App\Models\ClearanceOffice;
use App\Models\ClearanceWorkflowStep;
use App\Models\College;
use App\Models\Department;
use App\Models\Program;
use App\Models\Role;
use App\Models\StudentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StudentDepartmentProgramValidationTest extends TestCase
{
    use \Illuminate\Foundation\Testing\RefreshDatabase;

    public function test_student_cannot_be_created_with_program_from_different_department()
    {
        Role::firstOrCreate([
            'name' => 'Student',
            'code' => 'student',
        ], [
            'is_active' => true,
        ]);

        $college = College::create([
            'name' => 'Main College ' . uniqid(),
            'code' => 'MC-' . uniqid(),
            'description' => 'Test college',
            'is_active' => true,
        ]);

        $computerScienceDepartment = Department::create([
            'college_id' => $college->id,
            'name' => 'Computer Science ' . uniqid(),
            'code' => 'CS-' . uniqid(),
            'description' => 'CS dept',
            'is_active' => true,
        ]);

        $businessDepartment = Department::create([
            'college_id' => $college->id,
            'name' => 'Business Administration ' . uniqid(),
            'code' => 'BA-' . uniqid(),
            'description' => 'BA dept',
            'is_active' => true,
        ]);

        Program::create([
            'department_id' => $computerScienceDepartment->id,
            'name' => 'Software Engineering ' . uniqid(),
            'code' => 'SE-' . uniqid(),
            'description' => 'SE program',
            'level' => 'undergraduate',
            'is_active' => true,
        ]);

        $businessProgram = Program::create([
            'department_id' => $businessDepartment->id,
            'name' => 'Marketing ' . uniqid(),
            'code' => 'MK-' . uniqid(),
            'description' => 'Marketing program',
            'level' => 'undergraduate',
            'is_active' => true,
        ]);

        $studentType = StudentType::firstOrCreate([
            'name' => 'Regular ' . uniqid(),
            'code' => 'REG-' . uniqid(),
        ], [
            'description' => 'Regular student',
            'is_active' => true,
        ]);

        $request = Request::create('/api/admin/students', 'POST', [
            'first_name' => 'Alice',
            'middle_name' => 'B.',
            'last_name' => 'Tester',
            'email' => 'alice@example.com',
            'student_id' => 'STU-1001',
            'college_id' => $college->id,
            'department_id' => $computerScienceDepartment->id,
            'program_id' => $businessProgram->id,
            'student_type_id' => $studentType->id,
            'academic_year' => '2026',
            'admission_year' => 2026,
        ]);

        $response = app(AdminController::class)->createStudent($request);

        $this->assertSame(422, $response->getStatusCode());
        $this->assertTrue(isset($response->getData()->errors->program_id));
        $this->assertStringContainsString('selected program', json_encode($response->getData()->errors));
    }

    public function test_regular_students_do_not_require_continuing_education_clearance()
    {
        $regularType = StudentType::create([
            'name' => 'Regular',
            'code' => 'regular',
            'description' => 'Regular student',
            'is_active' => true,
        ]);

        $extensionType = StudentType::create([
            'name' => 'Extension',
            'code' => 'extension',
            'description' => 'Extension student',
            'is_active' => true,
        ]);

        $summerType = StudentType::create([
            'name' => 'Summer',
            'code' => 'summer',
            'description' => 'Summer student',
            'is_active' => true,
        ]);

        $winterType = StudentType::create([
            'name' => 'Winter',
            'code' => 'winter',
            'description' => 'Winter student',
            'is_active' => true,
        ]);

        $continuingEducationOffice = ClearanceOffice::create([
            'name' => 'Continuing Education',
            'code' => 'continuing_education',
            'description' => 'Continuing education college level clearance',
            'is_active' => true,
        ]);

        $request = new Request();
        $controller = new AdminWorkflowController();

        $controller->resetToDefault($regularType->id);
        $regularStep = ClearanceWorkflowStep::where('student_type_id', $regularType->id)
            ->where('clearance_office_id', $continuingEducationOffice->id)
            ->first();

        $controller->resetToDefault($extensionType->id);
        $extensionStep = ClearanceWorkflowStep::where('student_type_id', $extensionType->id)
            ->where('clearance_office_id', $continuingEducationOffice->id)
            ->first();

        $controller->resetToDefault($summerType->id);
        $summerStep = ClearanceWorkflowStep::where('student_type_id', $summerType->id)
            ->where('clearance_office_id', $continuingEducationOffice->id)
            ->first();

        $controller->resetToDefault($winterType->id);
        $winterStep = ClearanceWorkflowStep::where('student_type_id', $winterType->id)
            ->where('clearance_office_id', $continuingEducationOffice->id)
            ->first();

        $this->assertNotNull($regularStep);
        $this->assertFalse((bool) $regularStep->is_required);

        $this->assertNotNull($extensionStep);
        $this->assertTrue((bool) $extensionStep->is_required);

        $this->assertNotNull($summerStep);
        $this->assertTrue((bool) $summerStep->is_required);

        $this->assertNotNull($winterStep);
        $this->assertTrue((bool) $winterStep->is_required);
    }
}

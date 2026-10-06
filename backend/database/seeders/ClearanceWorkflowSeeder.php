<?php

namespace Database\Seeders;

use App\Models\ClearanceWorkflowStep;
use App\Models\StudentType;
use App\Models\ClearanceOffice;
use Illuminate\Database\Seeder;

class ClearanceWorkflowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get student types
        $regular = StudentType::where('code', 'regular')->first();
        $winter = StudentType::where('code', 'winter')->first();
        $summer = StudentType::where('code', 'summer')->first();
        $extension = StudentType::where('code', 'extension')->first();

        // Get clearance offices
        $advisor = ClearanceOffice::where('code', 'advisor')->first();
        $deptHead = ClearanceOffice::where('code', 'department_head')->first();
        $library = ClearanceOffice::where('code', 'library')->first();
        $dormitory = ClearanceOffice::where('code', 'dormitory')->first();
        $laboratory = ClearanceOffice::where('code', 'laboratory')->first();
        $cafeteria = ClearanceOffice::where('code', 'cafeteria')->first();
        $police = ClearanceOffice::where('code', 'police')->first();
        $studentService = ClearanceOffice::where('code', 'student_service')->first();
        $costSharing = ClearanceOffice::where('code', 'cost_sharing')->first();
        $continuingEd = ClearanceOffice::where('code', 'continuing_education')->first();
        $registrar = ClearanceOffice::where('code', 'registrar')->first();

        // New workflow order:
        // 1. Advisor (Department Level)
        // 2. Department Head
        // 3. Library Chief
        // 4. Dormitory
        // 5. Laboratory Chief (Department level)
        // 6. Cafeteria (only Regular)
        // 7. University Police (Robe or Goba)
        // 8. Student Service (only Regular)
        // 9. Cost Sharing (only Regular)
        // 10. Continuing Education
        // 11. Registrar and Alumni

        // Regular students - ALL offices except Continuing Education
        $regularWorkflow = [
            ['office' => $advisor, 'order' => 1, 'required' => true],
            ['office' => $deptHead, 'order' => 2, 'required' => true],
            ['office' => $library, 'order' => 3, 'required' => true],
            ['office' => $dormitory, 'order' => 4, 'required' => true],
            ['office' => $laboratory, 'order' => 5, 'required' => true],
            ['office' => $cafeteria, 'order' => 6, 'required' => true], // Regular only
            ['office' => $police, 'order' => 7, 'required' => true],
            ['office' => $studentService, 'order' => 8, 'required' => true], // Regular only
            ['office' => $costSharing, 'order' => 9, 'required' => true], // Regular only
            ['office' => $continuingEd, 'order' => 10, 'required' => false], // Only extension/summer/winter in-service
            ['office' => $registrar, 'order' => 11, 'required' => true],
        ];

        if (!$regular || !$extension || !$summer || !$winter) {
            return;
        }

        foreach ($regularWorkflow as $step) {
            if (!$step['office']) continue;
            ClearanceWorkflowStep::firstOrCreate([
                'student_type_id' => $regular->id,
                'clearance_office_id' => $step['office']->id,
            ], [
                'step_order' => $step['order'],
                'is_required' => $step['required'],
                'is_active' => true,
            ]);
        }

        // Extension students - NO Cafeteria, Student Service, Cost Sharing
        $extensionWorkflow = [
            ['office' => $advisor, 'order' => 1, 'required' => true],
            ['office' => $deptHead, 'order' => 2, 'required' => true],
            ['office' => $library, 'order' => 3, 'required' => true],
            ['office' => $dormitory, 'order' => 4, 'required' => true],
            ['office' => $laboratory, 'order' => 5, 'required' => true],
            ['office' => $cafeteria, 'order' => 6, 'required' => false], // Not required for extension
            ['office' => $police, 'order' => 7, 'required' => true],
            ['office' => $studentService, 'order' => 8, 'required' => false], // Not required for extension
            ['office' => $costSharing, 'order' => 9, 'required' => false], // Not required for extension
            ['office' => $continuingEd, 'order' => 10, 'required' => true],
            ['office' => $registrar, 'order' => 11, 'required' => true],
        ];

        foreach ($extensionWorkflow as $step) {
            if (!$step['office']) continue;
            ClearanceWorkflowStep::firstOrCreate([
                'student_type_id' => $extension->id,
                'clearance_office_id' => $step['office']->id,
            ], [
                'step_order' => $step['order'],
                'is_required' => $step['required'],
                'is_active' => true,
            ]);
        }

        // Summer students - NO Cafeteria, Student Service, Cost Sharing
        $summerWorkflow = [
            ['office' => $advisor, 'order' => 1, 'required' => true],
            ['office' => $deptHead, 'order' => 2, 'required' => true],
            ['office' => $library, 'order' => 3, 'required' => true],
            ['office' => $dormitory, 'order' => 4, 'required' => true],
            ['office' => $laboratory, 'order' => 5, 'required' => true],
            ['office' => $cafeteria, 'order' => 6, 'required' => false], // Not required for summer
            ['office' => $police, 'order' => 7, 'required' => true],
            ['office' => $studentService, 'order' => 8, 'required' => false], // Not required for summer
            ['office' => $costSharing, 'order' => 9, 'required' => false], // Not required for summer
            ['office' => $continuingEd, 'order' => 10, 'required' => true],
            ['office' => $registrar, 'order' => 11, 'required' => true],
        ];

        foreach ($summerWorkflow as $step) {
            if (!$step['office']) continue;
            ClearanceWorkflowStep::firstOrCreate([
                'student_type_id' => $summer->id,
                'clearance_office_id' => $step['office']->id,
            ], [
                'step_order' => $step['order'],
                'is_required' => $step['required'],
                'is_active' => true,
            ]);
        }

        // Winter students - NO Cafeteria, Student Service, Cost Sharing
        $winterWorkflow = [
            ['office' => $advisor, 'order' => 1, 'required' => true],
            ['office' => $deptHead, 'order' => 2, 'required' => true],
            ['office' => $library, 'order' => 3, 'required' => true],
            ['office' => $dormitory, 'order' => 4, 'required' => true],
            ['office' => $laboratory, 'order' => 5, 'required' => true],
            ['office' => $cafeteria, 'order' => 6, 'required' => false], // Not required for winter
            ['office' => $police, 'order' => 7, 'required' => true],
            ['office' => $studentService, 'order' => 8, 'required' => false], // Not required for winter
            ['office' => $costSharing, 'order' => 9, 'required' => false], // Not required for winter
            ['office' => $continuingEd, 'order' => 10, 'required' => true],
            ['office' => $registrar, 'order' => 11, 'required' => true],
        ];

        foreach ($winterWorkflow as $step) {
            if (!$step['office']) continue;
            ClearanceWorkflowStep::firstOrCreate([
                'student_type_id' => $winter->id,
                'clearance_office_id' => $step['office']->id,
            ], [
                'step_order' => $step['order'],
                'is_required' => $step['required'],
                'is_active' => true,
            ]);
        }
    }
}

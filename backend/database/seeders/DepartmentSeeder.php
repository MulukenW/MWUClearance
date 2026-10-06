<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\College;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $cncs = College::where('code', 'CNCS')->first();
        $cbe = College::where('code', 'CBE')->first();
        $cssh = College::where('code', 'CSSH')->first();
        $cet = College::where('code', 'CET')->first();

        $departments = [
            // CNCS Departments
            [
                'college_id' => $cncs->id,
                'name' => 'Computer Science',
                'code' => 'CS',
                'description' => 'Computer Science Department',
                'is_active' => true,
            ],
            [
                'college_id' => $cncs->id,
                'name' => 'Information Technology',
                'code' => 'IT',
                'description' => 'Information Technology Department',
                'is_active' => true,
            ],
            [
                'college_id' => $cncs->id,
                'name' => 'Mathematics',
                'code' => 'MATH',
                'description' => 'Mathematics Department',
                'is_active' => true,
            ],
            // CBE Departments
            [
                'college_id' => $cbe->id,
                'name' => 'Accounting and Finance',
                'code' => 'ACFN',
                'description' => 'Accounting and Finance Department',
                'is_active' => true,
            ],
            [
                'college_id' => $cbe->id,
                'name' => 'Management',
                'code' => 'MGT',
                'description' => 'Management Department',
                'is_active' => true,
            ],
            // CSSH Departments
            [
                'college_id' => $cssh->id,
                'name' => 'English Language and Literature',
                'code' => 'ENG',
                'description' => 'English Language and Literature Department',
                'is_active' => true,
            ],
            [
                'college_id' => $cssh->id,
                'name' => 'History',
                'code' => 'HIST',
                'description' => 'History Department',
                'is_active' => true,
            ],
            // CET Departments
            [
                'college_id' => $cet->id,
                'name' => 'Electrical Engineering',
                'code' => 'EE',
                'description' => 'Electrical Engineering Department',
                'is_active' => true,
            ],
            [
                'college_id' => $cet->id,
                'name' => 'Civil Engineering',
                'code' => 'CE',
                'description' => 'Civil Engineering Department',
                'is_active' => true,
            ],
        ];

        foreach ($departments as $department) {
            Department::firstOrCreate(['code' => $department['code']], $department);
        }
    }
}

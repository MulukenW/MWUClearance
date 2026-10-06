<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Department;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $cs = Department::where('code', 'CS')->first();
        $it = Department::where('code', 'IT')->first();
        $math = Department::where('code', 'MATH')->first();
        $acfn = Department::where('code', 'ACFN')->first();
        $mgt = Department::where('code', 'MGT')->first();

        if (!$cs || !$it || !$math || !$acfn || !$mgt) {
            return;
        }

        $programs = [
            // Computer Science
            [
                'department_id' => $cs->id,
                'name' => 'Bachelor of Science in Computer Science',
                'code' => 'BSC-CS',
                'description' => 'Undergraduate program in Computer Science',
                'level' => 'undergraduate',
                'is_active' => true,
            ],
            [
                'department_id' => $cs->id,
                'name' => 'Master of Science in Computer Science',
                'code' => 'MSC-CS',
                'description' => 'Postgraduate program in Computer Science',
                'level' => 'postgraduate',
                'is_active' => true,
            ],
            // Information Technology
            [
                'department_id' => $it->id,
                'name' => 'Bachelor of Science in Information Technology',
                'code' => 'BSC-IT',
                'description' => 'Undergraduate program in Information Technology',
                'level' => 'undergraduate',
                'is_active' => true,
            ],
            // Mathematics
            [
                'department_id' => $math->id,
                'name' => 'Bachelor of Science in Mathematics',
                'code' => 'BSC-MATH',
                'description' => 'Undergraduate program in Mathematics',
                'level' => 'undergraduate',
                'is_active' => true,
            ],
            // Accounting
            [
                'department_id' => $acfn->id,
                'name' => 'Bachelor of Arts in Accounting and Finance',
                'code' => 'BA-ACFN',
                'description' => 'Undergraduate program in Accounting and Finance',
                'level' => 'undergraduate',
                'is_active' => true,
            ],
            // Management
            [
                'department_id' => $mgt->id,
                'name' => 'Bachelor of Arts in Management',
                'code' => 'BA-MGT',
                'description' => 'Undergraduate program in Management',
                'level' => 'undergraduate',
                'is_active' => true,
            ],
        ];

        foreach ($programs as $program) {
            Program::firstOrCreate(['code' => $program['code']], $program);
        }
    }
}

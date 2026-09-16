<?php

namespace Database\Seeders;

use App\Models\ClearanceOffice;
use Illuminate\Database\Seeder;

class ClearanceOfficeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $offices = [
            [
                'name' => 'Academic Advisor',
                'code' => 'advisor',
                'description' => 'Academic advisor clearance (Department Level)',
                'is_active' => true,
            ],
            [
                'name' => 'Department Head',
                'code' => 'department_head',
                'description' => 'Department head clearance',
                'is_active' => true,
            ],
            [
                'name' => 'Library Chief',
                'code' => 'library',
                'description' => 'Library chief clearance',
                'is_active' => true,
            ],
            [
                'name' => 'Dormitory',
                'code' => 'dormitory',
                'description' => 'Dormitory clearance',
                'is_active' => true,
            ],
            [
                'name' => 'Laboratory Chief',
                'code' => 'laboratory',
                'description' => 'Laboratory chief clearance (Department Level)',
                'is_active' => true,
            ],
            [
                'name' => 'Cafeteria',
                'code' => 'cafeteria',
                'description' => 'Cafeteria clearance (Regular students only)',
                'is_active' => true,
            ],
            [
                'name' => 'University Police',
                'code' => 'police',
                'description' => 'University police clearance (Robe or Goba campus)',
                'is_active' => true,
            ],
            [
                'name' => 'Student Service',
                'code' => 'student_service',
                'description' => 'Student service clearance (Regular students only)',
                'is_active' => true,
            ],
            [
                'name' => 'Cost Sharing',
                'code' => 'cost_sharing',
                'description' => 'Cost sharing clearance (Regular students only)',
                'is_active' => true,
            ],
            [
                'name' => 'Continuing Education',
                'code' => 'continuing_education',
                'description' => 'Continuing education college level clearance',
                'is_active' => true,
            ],
            [
                'name' => 'Registrar and Alumni',
                'code' => 'registrar',
                'description' => 'Registrar and alumni final clearance',
                'is_active' => true,
            ],
        ];

        foreach ($offices as $office) {
            ClearanceOffice::create($office);
        }
    }
}

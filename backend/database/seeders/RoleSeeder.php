<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $roles = [
            [
                'name' => 'System Administrator',
                'code' => 'admin',
                'description' => 'Full system access and configuration',
                'is_active' => true,
            ],
            [
                'name' => 'Student',
                'code' => 'student',
                'description' => 'Student user',
                'is_active' => true,
            ],
            [
                'name' => 'Academic Advisor',
                'code' => 'advisor',
                'description' => 'Academic advisor reviewing clearances',
                'is_active' => true,
            ],
            [
                'name' => 'Department Head',
                'code' => 'department_head',
                'description' => 'Department head approving clearances',
                'is_active' => true,
            ],
            [
                'name' => 'Laboratory Officer',
                'code' => 'laboratory',
                'description' => 'Laboratory clearance officer',
                'is_active' => true,
            ],
            [
                'name' => 'Library Officer',
                'code' => 'library',
                'description' => 'Library clearance officer',
                'is_active' => true,
            ],
            [
                'name' => 'Dormitory/Student Services Officer',
                'code' => 'dormitory',
                'description' => 'Dormitory and student services clearance officer',
                'is_active' => true,
            ],
            [
                'name' => 'Police Officer',
                'code' => 'police',
                'description' => 'Police clearance officer',
                'is_active' => true,
            ],
            [
                'name' => 'Registrar',
                'code' => 'registrar',
                'description' => 'Registrar - final clearance authority',
                'is_active' => true,
            ],
            [
                'name' => 'Cafeteria Officer',
                'code' => 'cafeteria',
                'description' => 'Cafeteria clearance officer',
                'is_active' => true,
            ],
            [
                'name' => 'Student Services Officer',
                'code' => 'student_service',
                'description' => 'Student services clearance officer',
                'is_active' => true,
            ],
            [
                'name' => 'Cost Sharing Officer',
                'code' => 'cost_sharing',
                'description' => 'Cost sharing clearance officer',
                'is_active' => true,
            ],
            [
                'name' => 'Continuing Education Officer',
                'code' => 'continuing_education',
                'description' => 'Continuing education clearance officer',
                'is_active' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['code' => $role['code']], $role);
        }
    }
}

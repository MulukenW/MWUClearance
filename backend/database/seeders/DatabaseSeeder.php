<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // Order matters: Dependencies must be seeded first
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            StudentTypeSeeder::class,
            ClearanceOfficeSeeder::class,
            ClearanceWorkflowSeeder::class,
            CollegeSeeder::class,
            DepartmentSeeder::class,
            ProgramSeeder::class,
            MwuAcademicStructureSeeder::class,
            UserSeeder::class,
            StudentSeeder::class,
        ]);
    }
}

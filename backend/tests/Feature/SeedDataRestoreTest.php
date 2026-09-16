<?php

namespace Tests\Feature;

use App\Models\College;
use App\Models\Department;
use App\Models\Student;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeedDataRestoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_restores_colleges_departments_and_students()
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertGreaterThan(0, College::count());
        $this->assertGreaterThan(0, Department::count());
        $this->assertGreaterThan(0, Student::count());
    }
}

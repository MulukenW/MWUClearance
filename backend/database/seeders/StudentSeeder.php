<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use App\Models\Program;
use App\Models\StudentType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get necessary data
        $studentRole = Role::where('code', 'student')->first();
        $csDept = Department::where('code', 'CS')->first();
        $itDept = Department::where('code', 'IT')->first();
        $csProgram = Program::where('code', 'BSC-CS')->first();
        $itProgram = Program::where('code', 'BSC-IT')->first();
        $regularType = StudentType::where('code', 'regular')->first();
        $extensionType = StudentType::where('code', 'extension')->first();
        $advisor = User::where('email', 'advisor.cs@mwu.edu.et')->first();

        // Guard against missing dependencies
        if (!$studentRole || !$csDept || !$itDept || !$csProgram || !$itProgram || !$regularType || !$extensionType || !$advisor) {
            return;
        }

        // Create Regular Student 1
        $user1 = User::firstOrCreate(
            ['email' => 'abebe.kebede@student.mwu.edu.et'],
            [
                'name' => 'Abebe Kebede',
                'password' => Hash::make('password'),
                'role_id' => $studentRole->id,
                'status' => 'active',
            ]
        );

        Student::firstOrCreate(
            ['student_id' => 'MWU/CS/2020/001'],
            [
                'user_id' => $user1->id,
                'first_name' => 'Abebe',
                'middle_name' => 'Kebede',
                'last_name' => 'Tesfaye',
                'college_id' => $csDept->college_id,
                'department_id' => $csDept->id,
                'program_id' => $csProgram->id,
                'student_type_id' => $regularType->id,
                'academic_advisor_id' => $advisor->id,
                'academic_year' => '2019/20',
                'admission_year' => 2013,
                'status' => 'active',
                'phone' => '+251911234567',
                'email' => 'abebe.kebede@student.mwu.edu.et',
            ]
        );

        // Create Regular Student 2
        $user2 = User::firstOrCreate(
            ['email' => 'tigist.alemu@student.mwu.edu.et'],
            [
                'name' => 'Tigist Alemu',
                'password' => Hash::make('password'),
                'role_id' => $studentRole->id,
                'status' => 'active',
            ]
        );

        Student::firstOrCreate(
            ['student_id' => 'MWU/CS/2021/002'],
            [
                'user_id' => $user2->id,
                'first_name' => 'Tigist',
                'middle_name' => 'Alemu',
                'last_name' => 'Gebre',
                'college_id' => $csDept->college_id,
                'department_id' => $csDept->id,
                'program_id' => $csProgram->id,
                'student_type_id' => $regularType->id,
                'academic_advisor_id' => $advisor->id,
                'academic_year' => '2019/20',
                'admission_year' => 2014,
                'status' => 'active',
                'phone' => '+251922345678',
                'email' => 'tigist.alemu@student.mwu.edu.et',
            ]
        );

        // Create Extension/Weekend Student
        $user3 = User::firstOrCreate(
            ['email' => 'mohammed.ali@student.mwu.edu.et'],
            [
                'name' => 'Mohammed Ali',
                'password' => Hash::make('password'),
                'role_id' => $studentRole->id,
                'status' => 'active',
            ]
        );

        Student::firstOrCreate(
            ['student_id' => 'MWU/IT/2022/003'],
            [
                'user_id' => $user3->id,
                'first_name' => 'Mohammed',
                'middle_name' => 'Ali',
                'last_name' => 'Hassan',
                'college_id' => $itDept->college_id,
                'department_id' => $itDept->id,
                'program_id' => $itProgram->id,
                'student_type_id' => $extensionType->id,
                'academic_advisor_id' => $advisor->id,
                'academic_year' => '2019/20',
                'admission_year' => 2015,
                'status' => 'active',
                'phone' => '+251933456789',
                'email' => 'mohammed.ali@student.mwu.edu.et',
            ]
        );

        // Create IT Regular Student
        $user4 = User::firstOrCreate(
            ['email' => 'sara.yohannes@student.mwu.edu.et'],
            [
                'name' => 'Sara Yohannes',
                'password' => Hash::make('password'),
                'role_id' => $studentRole->id,
                'status' => 'active',
            ]
        );

        Student::firstOrCreate(
            ['student_id' => 'MWU/IT/2020/004'],
            [
                'user_id' => $user4->id,
                'first_name' => 'Sara',
                'middle_name' => 'Yohannes',
                'last_name' => 'Bekele',
                'college_id' => $itDept->college_id,
                'department_id' => $itDept->id,
                'program_id' => $itProgram->id,
                'student_type_id' => $regularType->id,
                'academic_advisor_id' => $advisor->id,
                'academic_year' => '2019/20',
                'admission_year' => 2013,
                'status' => 'active',
                'phone' => '+251944567890',
                'email' => 'sara.yohannes@student.mwu.edu.et',
            ]
        );
    }
}

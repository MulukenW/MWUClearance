<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use App\Models\ClearanceOffice;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get roles
        $adminRole      = Role::where('code', 'admin')->first();
        $advisorRole    = Role::where('code', 'advisor')->first();
        $deptHeadRole   = Role::where('code', 'department_head')->first();
        $labRole        = Role::where('code', 'laboratory')->first();
        $libraryRole    = Role::where('code', 'library')->first();
        $dormitoryRole  = Role::where('code', 'dormitory')->first();
        $policeRole     = Role::where('code', 'police')->first();
        $registrarRole  = Role::where('code', 'registrar')->first();

        // Get clearance offices
        $advisorOffice   = ClearanceOffice::where('code', 'advisor')->first();
        $deptHeadOffice  = ClearanceOffice::where('code', 'department_head')->first();
        $labOffice       = ClearanceOffice::where('code', 'laboratory')->first();
        $libraryOffice   = ClearanceOffice::where('code', 'library')->first();
        $dormitoryOffice = ClearanceOffice::where('code', 'dormitory')->first();
        $policeOffice    = ClearanceOffice::where('code', 'police')->first();
        $registrarOffice = ClearanceOffice::where('code', 'registrar')->first();

        // ── System Administrator ──────────────────────────────────
        User::updateOrCreate(
            ['email' => 'admin@mwu.edu.et'],
            [
                'name'     => 'System Administrator',
                'password' => Hash::make('password'),
                'role_id'  => $adminRole->id,
                'status'   => 'active',
            ]
        );

        // ── Per-department Advisors & Department Heads ────────────
        $departments = Department::all();

        $advisorNames = [
            'CS'   => 'Dr. John Smith',
            'IT'   => 'Dr. Amina Yusuf',
            'MATH' => 'Dr. Bekele Tadesse',
            'ACFN' => 'Dr. Fatuma Ahmed',
            'MGT'  => 'Dr. Daniel Worku',
            'ENG'  => 'Dr. Helen Tsegaye',
            'HIST' => 'Dr. Ibrahim Mohammed',
            'EE'   => 'Dr. Meron Assefa',
            'CE'   => 'Dr. Solomon Girma',
        ];

        $headNames = [
            'CS'   => 'Prof. Jane Doe',
            'IT'   => 'Prof. Ali Mohammed',
            'MATH' => 'Prof. Tigist Haile',
            'ACFN' => 'Prof. Mohammed Nur',
            'MGT'  => 'Prof. Sara Bekele',
            'ENG'  => 'Prof. Yonas Dereje',
            'HIST' => 'Prof. Zainab Omar',
            'EE'   => 'Prof. Abebe Lemma',
            'CE'   => 'Prof. Bethlehem Kebede',
        ];

        $labNames = [
            'CS'   => 'Ato Kebede Wolde',
            'IT'   => 'Ato Girma Tadesse',
            'MATH' => 'Ato Fikadu Lemma',
            'ACFN' => 'Ato Mekonnen Haile',
            'MGT'  => 'Ato Yohannes Bekele',
            'ENG'  => 'Ato Dereje Alemu',
            'HIST' => 'Ato Tesfaye Girma',
            'EE'   => 'Ato Assefa Mekonnen',
            'CE'   => 'Ato Lemma Tadesse',
        ];

        foreach ($departments as $dept) {
            // Academic Advisor for this department
            User::updateOrCreate(
                ['email' => 'advisor.' . strtolower($dept->code) . '@mwu.edu.et'],
                [
                    'name'              => $advisorNames[$dept->code] ?? "Advisor {$dept->name}",
                    'password'          => Hash::make('password'),
                    'role_id'           => $advisorRole->id,
                    'department_id'     => $dept->id,
                    'clearance_office_id' => $advisorOffice->id,
                    'status'            => 'active',
                ]
            );

            // Department Head for this department
            User::updateOrCreate(
                ['email' => 'head.' . strtolower($dept->code) . '@mwu.edu.et'],
                [
                    'name'              => $headNames[$dept->code] ?? "Head {$dept->name}",
                    'password'          => Hash::make('password'),
                    'role_id'           => $deptHeadRole->id,
                    'department_id'     => $dept->id,
                    'clearance_office_id' => $deptHeadOffice->id,
                    'status'            => 'active',
                ]
            );

            // Laboratory Officer for this department
            User::updateOrCreate(
                ['email' => 'lab.' . strtolower($dept->code) . '@mwu.edu.et'],
                [
                    'name'              => $labNames[$dept->code] ?? "Lab Officer {$dept->name}",
                    'password'          => Hash::make('password'),
                    'role_id'           => $labRole->id,
                    'department_id'     => $dept->id,
                    'clearance_office_id' => $labOffice->id,
                    'status'            => 'active',
                ]
            );
        }

        // ── Centralized Officers (no department) ─────────────────
        User::updateOrCreate(
            ['email' => 'library@mwu.edu.et'],
            [
                'name'     => 'Ato Ahmed Hassan',
                'password' => Hash::make('password'),
                'role_id'  => $libraryRole->id,
                'clearance_office_id' => $libraryOffice->id,
                'status'   => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'dormitory@mwu.edu.et'],
            [
                'name'     => 'Ato Tadesse Birru',
                'password' => Hash::make('password'),
                'role_id'  => $dormitoryRole->id,
                'clearance_office_id' => $dormitoryOffice->id,
                'status'   => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'police@mwu.edu.et'],
            [
                'name'     => 'Ato Demeke Getachew',
                'password' => Hash::make('password'),
                'role_id'  => $policeRole->id,
                'clearance_office_id' => $policeOffice->id,
                'status'   => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'registrar@mwu.edu.et'],
            [
                'name'     => 'Ms. Sara Mohammed',
                'password' => Hash::make('password'),
                'role_id'  => $registrarRole->id,
                'clearance_office_id' => $registrarOffice->id,
                'status'   => 'active',
            ]
        );
    }
}

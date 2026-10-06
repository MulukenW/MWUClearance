<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $permissions = [
            // Student permissions
            ['name' => 'View Own Clearance', 'code' => 'view_own_clearance', 'description' => 'View own clearance status'],
            ['name' => 'Submit Clearance', 'code' => 'submit_clearance', 'description' => 'Submit clearance request'],
            ['name' => 'Download Certificate', 'code' => 'download_certificate', 'description' => 'Download clearance certificate'],
            
            // Officer permissions
            ['name' => 'Review Clearance', 'code' => 'review_clearance', 'description' => 'Review student clearance'],
            ['name' => 'Approve Clearance', 'code' => 'approve_clearance', 'description' => 'Approve student clearance'],
            ['name' => 'Reject Clearance', 'code' => 'reject_clearance', 'description' => 'Reject student clearance'],
            ['name' => 'Add Comment', 'code' => 'add_comment', 'description' => 'Add comment to clearance'],
            
            // Admin permissions
            ['name' => 'Manage Users', 'code' => 'manage_users', 'description' => 'Create, update, delete users'],
            ['name' => 'Manage Roles', 'code' => 'manage_roles', 'description' => 'Manage roles and permissions'],
            ['name' => 'Manage Students', 'code' => 'manage_students', 'description' => 'Manage student records'],
            ['name' => 'Manage Departments', 'code' => 'manage_departments', 'description' => 'Manage departments'],
            ['name' => 'Manage Workflow', 'code' => 'manage_workflow', 'description' => 'Configure clearance workflow'],
            ['name' => 'View Reports', 'code' => 'view_reports', 'description' => 'View system reports'],
            ['name' => 'View Audit Logs', 'code' => 'view_audit_logs', 'description' => 'View audit logs'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['code' => $permission['code']], $permission);
        }
    }
}

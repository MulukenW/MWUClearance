<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRoleAndDepartmentToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('email')->constrained('roles')->onDelete('restrict');
            $table->foreignId('department_id')->nullable()->after('role_id')->constrained('departments')->onDelete('set null');
            $table->foreignId('clearance_office_id')->nullable()->after('department_id')->constrained('clearance_offices')->onDelete('set null');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('clearance_office_id');
            
            $table->index('role_id');
            $table->index('department_id');
            $table->index('clearance_office_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropForeign(['department_id']);
            $table->dropForeign(['clearance_office_id']);
            $table->dropColumn(['role_id', 'department_id', 'clearance_office_id', 'status']);
        });
    }
}

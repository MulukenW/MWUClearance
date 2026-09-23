<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add college-level assignment for users.
 *
 * Some officer roles (e.g. Continuing Education Officer) operate at college
 * scope: they handle students from every department of their college, unlike
 * department-scoped roles (advisor, department head, laboratory).
 */
class AddCollegeToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('college_id')
                ->nullable()
                ->after('department_id')
                ->constrained('colleges')
                ->onDelete('set null');

            $table->index('college_id');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['college_id']);
            $table->dropIndex(['college_id']);
            $table->dropColumn('college_id');
        });
    }
};

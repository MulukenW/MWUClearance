<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAcademicYearToClearanceRequestsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('clearance_requests', function (Blueprint $table) {
            $table->string('academic_year', 20)->nullable()->after('police_location');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('clearance_requests', function (Blueprint $table) {
            $table->dropColumn('academic_year');
        });
    }
}

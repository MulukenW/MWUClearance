<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddProgramTypeAndReasonToClearanceRequestsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('clearance_requests', function (Blueprint $table) {
            $table->enum('program_type', ['regular', 'extension', 'summer', 'regular_in_service', 'winter_in_service'])
                ->nullable()
                ->after('purpose');
            $table->enum('reason_for_clearance', [
                'end_of_semester',
                'withdrawal',
                'academic_dismissal',
                'graduation',
                'other'
            ])->nullable()->after('program_type');
            $table->string('reason_other')->nullable()->after('reason_for_clearance');
            $table->enum('police_location', ['robe', 'goba'])->nullable()->after('reason_other');
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
            $table->dropColumn(['program_type', 'reason_for_clearance', 'reason_other', 'police_location']);
        });
    }
}

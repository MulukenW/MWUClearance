<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class AddShashemeneToPoliceLocationEnumInClearanceRequestsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::statement(
            "ALTER TABLE clearance_requests MODIFY police_location ENUM('robe', 'goba', 'shashemene') NULL"
        );
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Move any shashemene rows back to robe before narrowing the enum
        DB::table('clearance_requests')
            ->where('police_location', 'shashemene')
            ->update(['police_location' => 'robe']);

        DB::statement(
            "ALTER TABLE clearance_requests MODIFY police_location ENUM('robe', 'goba') NULL"
        );
    }
}

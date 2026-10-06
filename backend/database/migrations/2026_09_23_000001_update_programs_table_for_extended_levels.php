<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdateProgramsTableForExtendedLevels extends Migration
{
    public function up()
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->integer('duration_years')->nullable()->after('is_active');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE programs MODIFY COLUMN level ENUM('undergraduate','postgraduate','graduate','diploma','certificate','phd') DEFAULT 'undergraduate'");
        }
    }

    public function down()
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn('duration_years');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE programs MODIFY COLUMN level ENUM('undergraduate','postgraduate','phd') DEFAULT 'undergraduate'");
        }
    }
};

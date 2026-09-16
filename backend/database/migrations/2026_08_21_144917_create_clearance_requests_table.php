<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateClearanceRequestsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('clearance_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('clearance_number')->unique();
            $table->enum('status', ['draft', 'submitted', 'in_progress', 'approved', 'rejected', 'completed'])->default('draft');
            $table->text('purpose')->nullable();
            $table->date('submitted_at')->nullable();
            $table->date('completed_at')->nullable();
            $table->timestamps();
            
            $table->index('student_id');
            $table->index('clearance_number');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('clearance_requests');
    }
}

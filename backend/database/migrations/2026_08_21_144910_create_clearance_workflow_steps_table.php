<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateClearanceWorkflowStepsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('clearance_workflow_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_type_id')->constrained('student_types')->onDelete('cascade');
            $table->foreignId('clearance_office_id')->constrained('clearance_offices')->onDelete('cascade');
            $table->integer('step_order');
            $table->boolean('is_required')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['student_type_id', 'clearance_office_id'], 'workflow_type_office_unique');
            $table->index('student_type_id');
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
        Schema::dropIfExists('clearance_workflow_steps');
    }
}

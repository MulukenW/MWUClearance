<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('student_id')->unique();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->foreignId('college_id')->constrained('colleges')->onDelete('restrict');
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->foreignId('program_id')->constrained('programs')->onDelete('restrict');
            $table->foreignId('student_type_id')->constrained('student_types')->onDelete('restrict');
            $table->foreignId('academic_advisor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('academic_year');
            $table->year('admission_year');
            $table->enum('status', ['active', 'inactive', 'graduated', 'suspended'])->default('active');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->timestamps();
            
            $table->index('student_id');
            $table->index('department_id');
            $table->index('program_id');
            $table->index('student_type_id');
            $table->index('academic_advisor_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('students');
    }
}

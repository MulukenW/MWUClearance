<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCertificatesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clearance_request_id')->constrained('clearance_requests')->onDelete('cascade');
            $table->string('certificate_number')->unique();
            $table->string('verification_code')->unique();
            $table->string('qr_code_path')->nullable();
            $table->string('pdf_path')->nullable();
            $table->date('issued_date');
            $table->foreignId('issued_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index('clearance_request_id');
            $table->index('certificate_number');
            $table->index('verification_code');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('certificates');
    }
}

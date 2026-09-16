<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateClearanceItemsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('clearance_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clearance_request_id')->constrained('clearance_requests')->onDelete('cascade');
            $table->foreignId('clearance_office_id')->constrained('clearance_offices')->onDelete('restrict');
            $table->integer('step_order');
            $table->boolean('is_required');
            $table->enum('status', ['locked', 'pending', 'under_review', 'approved', 'rejected', 'not_required'])->default('locked');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            
            $table->index('clearance_request_id');
            $table->index('clearance_office_id');
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
        Schema::dropIfExists('clearance_items');
    }
}

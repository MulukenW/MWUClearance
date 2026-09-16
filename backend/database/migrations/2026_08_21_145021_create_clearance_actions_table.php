<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateClearanceActionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('clearance_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clearance_item_id')->constrained('clearance_items')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->enum('action', ['created', 'submitted', 'reviewed', 'approved', 'rejected', 'resubmitted', 'commented'])->default('created');
            $table->text('comment')->nullable();
            $table->text('metadata')->nullable(); // JSON field for additional data
            $table->timestamps();
            
            $table->index('clearance_item_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('clearance_actions');
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateClearanceCommentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('clearance_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clearance_item_id')->constrained('clearance_items')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->text('comment');
            $table->boolean('is_internal')->default(false); // Internal notes vs student-visible
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
        Schema::dropIfExists('clearance_comments');
    }
}

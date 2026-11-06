<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id');
            $table->enum('type', ['in', 'out']);
            $table->float('unit_price')->nullable();
            $table->decimal('average_cost_snapshot', 12, 2)->nullable();
            $table->integer('quantity');
            $table->string('reason')->nullable();
            $table->foreignId('user_id')->constrained();
            $table->timestamp('moved_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};

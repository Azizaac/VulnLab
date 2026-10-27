<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_source_keys', function (Blueprint $table) {
            $table->string('source_key', 80)->primary();
            $table->foreignId('content_entry_id')->constrained('content_entries')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_source_keys');
    }
};

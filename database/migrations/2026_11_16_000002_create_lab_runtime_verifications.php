<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_runtime_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_id')->constrained('labs')->restrictOnDelete();
            $table->string('runtime_revision', 64);
            $table->json('checks_json');
            $table->timestamp('verified_at');
            $table->unique(['lab_id', 'runtime_revision']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_runtime_verifications');
    }
};

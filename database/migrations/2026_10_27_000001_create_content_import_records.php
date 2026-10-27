<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_import_records', function (Blueprint $table) {
            $table->id();
            $table->string('bundle', 80);
            $table->string('source_key', 80);
            $table->foreignId('content_entry_id')->constrained('content_entries')->restrictOnDelete();
            $table->foreignId('content_revision_id')->constrained('content_revisions')->restrictOnDelete();
            $table->string('source_hash', 64);
            $table->string('data_hash', 64);
            $table->json('provenance_json');
            $table->timestamps();
            $table->unique(['bundle', 'source_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_import_records');
    }
};

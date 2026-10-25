<?php

namespace App\Services;

use App\Models\ContentEntry;
use App\Models\ContentRevision;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ContentWorkflow
{
    public function __construct(private ContentSchema $schema, private ContentCatalog $catalog) {}

    public function create(User $user, string $kind, array $data): ContentRevision
    {
        Gate::forUser($user)->authorize('content.edit');
        $data = $this->schema->validate($kind, $data);

        return DB::transaction(function () use ($user, $kind, $data) {
            $table = match ($kind) {
                'lesson' => 'lessons', 'lab' => 'lab_specs', 'path' => 'learning_paths', default => null
            };
            if ($table && DB::table($table)->where('slug', $data['slug'])->exists()) {
                throw ValidationException::withMessages(['slug' => 'URL sudah digunakan oleh konten yang tersimpan.']);
            }
            if (ContentEntry::where('kind', $kind)->where('slug', $data['slug'])->exists() || ($kind === 'quiz' && ContentEntry::where('kind', 'quiz')->where('subject_id', $data['lesson_id'])->exists())) {
                throw ValidationException::withMessages(['slug' => 'Konten atau bank kuis sudah ada. Buat revisi melalui daftar konten.']);
            }
            $entry = ContentEntry::create(['kind' => $kind, 'slug' => $data['slug'], 'subject_id' => $kind === 'quiz' ? $data['lesson_id'] : null, 'is_managed' => true]);
            $revision = $entry->revisions()->create(['number' => 1, 'author_id' => $user->id, 'status' => 'draft', 'data_json' => $data]);
            $this->initialSave($revision, $user);
            StudioAccess::audit($user, 'content.created', 'entry', $entry->id, ['revision_id' => $revision->id, 'kind' => $kind]);

            return $revision;
        });
    }

    public function draft(User $user, ContentEntry $entry, ?int $from = null): ContentRevision
    {
        Gate::forUser($user)->authorize('content.edit');

        return DB::transaction(function () use ($user, $entry, $from) {
            $entry = ContentEntry::whereKey($entry->id)->lockForUpdate()->firstOrFail();
            abort_if($entry->revisions()->whereIn('status', ['draft', 'changes_requested', 'in_review', 'approved'])->exists(), 409, 'Revisi aktif sudah ada. Buka revisi tersebut.');
            $source = $from ? $entry->revisions()->findOrFail($from) : $entry->published;
            abort_unless($source, 422, 'Revisi sumber belum tersedia.');
            $revision = $entry->revisions()->create(['number' => $entry->revisions()->max('number') + 1, 'status' => 'draft', 'author_id' => $user->id, 'data_json' => $source->data_json]);
            $this->initialSave($revision, $user);
            StudioAccess::audit($user, 'content.draft_created', 'entry', $entry->id, ['revision_id' => $revision->id, 'from_revision' => $source->id]);

            return $revision;
        });
    }

    public function save(User $user, ContentRevision $revision, array $data, int $version): ContentRevision
    {
        Gate::forUser($user)->authorize('content.edit');

        return DB::transaction(function () use ($user, $revision, $data, $version) {
            $revision = $this->locked($revision, $version);
            abort_unless(in_array($revision->status, ['draft', 'changes_requested']), 409, 'Revisi ini terkunci. Buat revisi baru atau minta perubahan.');
            // Collaborative editing transfers authorship; this editor can no longer review it.
            $revision->fill(['data_json' => $this->schema->validate($revision->entry->kind, $data, false, $revision->entry), 'author_id' => $user->id, 'lock_version' => $version + 1])->save();
            DB::table('revision_saves')->insert(['content_revision_id' => $revision->id, 'lock_version' => $revision->lock_version, 'data_json' => json_encode($revision->data_json), 'actor_id' => $user->id, 'created_at' => now()]);
            StudioAccess::audit($user, 'content.draft_saved', 'revision', $revision->id, ['version' => $revision->lock_version]);

            return $revision;
        });
    }

    private function locked(ContentRevision $revision, int $version): ContentRevision
    {
        // Lock entry first for every state transition, then the revision.
        ContentEntry::whereKey($revision->content_entry_id)->lockForUpdate()->firstOrFail();
        $revision = ContentRevision::whereKey($revision->id)->lockForUpdate()->firstOrFail();
        abort_unless($revision->lock_version === $version, 409, 'Versi di server berubah. Draft lokal tetap ada; muat versi server sebelum menimpa.');

        return $revision;
    }

    public function transition(User $user, ContentRevision $revision, string $action, int $version, array $review = []): ContentRevision
    {
        Gate::forUser($user)->authorize(match ($action) {
            'submit' => 'content.edit', 'publish' => 'content.publish', default => 'content.review'
        });

        return DB::transaction(function () use ($user, $revision, $action, $version, $review) {
            $revision = $this->locked($revision, $version);
            $entry = $revision->entry;
            if ($action === 'submit') {
                abort_unless(in_array($revision->status, ['draft', 'changes_requested']), 409);
                $this->schema->validate($entry->kind, $revision->data_json, true, $entry);
                $revision->status = 'in_review';
                $revision->approved_by = null;
            } elseif ($action === 'publish') {
                abort_unless($revision->status === 'approved' && $revision->approved_by && $revision->approved_by !== $revision->author_id, 409, 'Persetujuan reviewer lain diperlukan.');
                $this->schema->validate($entry->kind, $revision->data_json, true, $entry);
                $this->catalog->project($entry, $revision);
                $revision->status = 'published';
                $revision->published_at = now();
                // Only operational in-app delivery; no pretend email queue.
                User::whereNull('suspended_at')->orderBy('id')->chunkById(200, function ($users) use ($revision) {
                    foreach ($users as $learner) {
                        if ($learner->account_preferences['content_updates'] ?? false) {
                            StudioAccess::notify($learner, 'content_update', 'Konten diperbarui: '.$revision->data_json['title'], match ($revision->entry->kind) {
                                'lesson' => '/learning/'.$revision->entry->slug, 'lab' => '/labs/'.$revision->entry->slug, 'quiz' => '/learning', default => '/roadmap'
                            });
                        }
                    }
                });
            } else {
                abort_unless($revision->status === 'in_review' || $revision->status === 'approved' && $action === 'request_changes', 409);
                $contributors = DB::table('revision_saves')->where('content_revision_id', $revision->id)->pluck('actor_id');
                abort_if($revision->author_id === $user->id || $contributors->contains($user->id), 403, 'Penulis atau kontributor tidak dapat meninjau revisi sendiri.');
                if ($action === 'approve' && collect(ContentSchema::CHECKS)->contains(fn ($key) => ($review['checks'][$key] ?? false) !== true)) {
                    throw ValidationException::withMessages(['checks' => 'Reviewer harus memeriksa akurasi, kejelasan, keamanan, referensi, dan lisensi.']);
                }
                DB::table('editorial_reviews')->insert(['content_revision_id' => $revision->id, 'reviewer_id' => $user->id, 'decision' => $action, 'notes' => $review['notes'], 'checks' => json_encode($review['checks']), 'created_at' => now()]);
                $revision->status = $action === 'approve' ? 'approved' : 'changes_requested';
                $revision->approved_by = $action === 'approve' ? $user->id : null;
            }
            $revision->lock_version++;
            $revision->save();
            StudioAccess::audit($user, 'content.'.$action, 'revision', $revision->id, ['entry_id' => $entry->id, 'status' => $revision->status, 'version' => $revision->lock_version]);

            return $revision;
        });
    }

    private function initialSave(ContentRevision $revision, User $user): void
    {
        DB::table('revision_saves')->insert(['content_revision_id' => $revision->id, 'lock_version' => 1, 'data_json' => json_encode($revision->data_json), 'actor_id' => $user->id, 'created_at' => now()]);
    }

    public function archive(User $user, ContentEntry $entry): void
    {
        Gate::forUser($user)->authorize('content.publish');
        DB::transaction(function () use ($user, $entry) {
            $entry = ContentEntry::whereKey($entry->id)->lockForUpdate()->firstOrFail();
            // Do not hide active prerequisites or parents and strand existing learning routes.
            if ($entry->kind === 'lesson' && DB::table('lesson_prerequisites')->where('prerequisite_id', $entry->subject_id)->exists()) {
                throw ValidationException::withMessages(['archive' => 'Lesson masih menjadi prasyarat. Terbitkan revisi penggantinya terlebih dahulu.']);
            }
            $table = match ($entry->kind) {
                'lesson' => 'lessons', 'lab' => 'labs', 'path' => 'learning_paths', 'module' => 'modules', default => null
            };
            if ($entry->kind === 'path' && DB::table('modules')->where('learning_path_id', $entry->subject_id)->where('catalog_visible', true)->exists() || $entry->kind === 'module' && DB::table('lessons')->where('module_id', $entry->subject_id)->where('catalog_visible', true)->exists()) {
                throw ValidationException::withMessages(['archive' => 'Arsipkan atau pindahkan konten anak dahulu.']);
            }
            if ($table && $entry->subject_id) {
                DB::table($table)->where('id', $entry->subject_id)->update(['catalog_visible' => false]);
            }
            if ($entry->kind === 'quiz') {
                DB::table('quiz_questions')->where('lesson_id', $entry->subject_id)->update(['catalog_active' => false]);
            }
            $entry->update(['is_archived' => true]);
            StudioAccess::audit($user, 'content.archived', 'entry', $entry->id);
        });
    }
}

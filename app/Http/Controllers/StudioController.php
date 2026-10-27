<?php

namespace App\Http\Controllers;

use App\Models\ContentEntry;
use App\Models\ContentRevision;
use App\Models\User;
use App\Services\AccountSecurity;
use App\Services\ContentCatalog;
use App\Services\ContentSchema;
use App\Services\ContentWorkflow;
use App\Services\SafeMarkdown;
use App\Services\StudioAccess;
use App\Support\UtcPayload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StudioController extends Controller
{
    public function index(Request $r, string $section = 'overview')
    {
        abort_unless(in_array($section, ['overview', 'content', 'quizzes', 'labs', 'roadmap', 'reviews', 'users', 'audit']), 404);
        if ($section === 'users') {
            Gate::authorize('users.manage');
        }
        if ($section === 'audit') {
            Gate::authorize('audit.read');
        }
        $filters = $r->validate(['q' => 'nullable|string|max:100', 'status' => 'nullable|in:draft,in_review,changes_requested,approved,published,archived', 'kind' => ['nullable', Rule::in(ContentSchema::KINDS)], 'difficulty' => 'nullable|string|max:30', 'path_id' => 'nullable|integer', 'reviewer_id' => 'nullable|integer', 'sort' => 'nullable|in:updated,title', 'page' => 'nullable|integer|min:1']);
        $kind = match ($section) {
            'quizzes' => 'quiz', 'labs' => 'lab', 'roadmap' => 'roadmap', default => $r->input('kind')
        };
        $query = ContentEntry::with(['revisions' => fn ($q) => $q->limit(1)])->when($kind, fn ($q) => $q->where('kind', $kind));
        $latest = fn ($q) => $q->whereRaw('number = (select max(r.number) from content_revisions r where r.content_entry_id = content_entries.id)');
        if ($r->filled('q')) {
            $query->whereHas('revisions', fn ($q) => $latest($q)->where('data_json->title', 'like', '%'.$r->input('q').'%'));
        }
        if ($r->filled('difficulty')) {
            $query->whereHas('revisions', fn ($q) => $latest($q)->where('data_json->difficulty', $r->input('difficulty')));
        }
        if ($r->filled('path_id')) {
            $pathId = $r->integer('path_id');
            $modules = DB::table('modules')->where('learning_path_id', $pathId)->pluck('id');
            $lessons = DB::table('lessons')->whereIn('module_id', $modules)->pluck('id');
            $lessonEntries = ContentEntry::where('kind', 'lesson')->whereHas('revisions', fn ($q) => $q->whereRaw('number = (select max(r.number) from content_revisions r where r.content_entry_id = content_revisions.content_entry_id)')->whereIn('data_json->module_id', $modules))->pluck('id');
            $query->where(function ($q) use ($latest, $pathId, $modules, $lessons, $lessonEntries) {
                $q->where(fn ($q) => $q->where('kind', 'path')->where('subject_id', $pathId))
                    ->orWhere(fn ($q) => $q->where('kind', 'module')->whereHas('revisions', fn ($q) => $latest($q)->where('data_json->path_id', $pathId)))
                    ->orWhere(fn ($q) => $q->where('kind', 'lesson')->whereHas('revisions', fn ($q) => $latest($q)->whereIn('data_json->module_id', $modules)))
                    ->orWhere(fn ($q) => $q->whereIn('kind', ['quiz', 'lab'])->whereHas('revisions', fn ($q) => $latest($q)->whereIn('data_json->lesson_id', $lessons)))
                    ->orWhere(fn ($q) => $q->where('kind', 'quiz')->whereIn('parent_lesson_entry_id', $lessonEntries));
            });
        }
        if ($r->filled('reviewer_id')) {
            $query->whereHas('revisions', fn ($q) => $latest($q)->where('approved_by', $r->integer('reviewer_id')));
        }
        $status = $section === 'reviews' ? 'in_review' : $r->input('status');
        if ($status === 'archived') {
            $query->where('is_archived', true);
        } elseif ($status) {
            $query->where('is_archived', false)->whereHas('revisions', fn ($q) => $q->where('status', $status)->whereRaw('number = (select max(r.number) from content_revisions r where r.content_entry_id = content_entries.id)'));
        }
        if ($r->input('sort') === 'title') {
            $query->orderBy(ContentRevision::select('data_json->title')->whereColumn('content_entry_id', 'content_entries.id')->latest('number')->limit(1));
        } else {
            $query->orderByDesc(ContentRevision::select('updated_at')->whereColumn('content_entry_id', 'content_entries.id')->latest('number')->limit(1));
        }

        return Inertia::render('Studio', [
            'section' => $section, 'filters' => $filters,
            'entries' => $query->paginate(15)->withQueryString()->through(fn ($e) => ['id' => $e->id, 'kind' => $e->kind, 'title' => $e->revisions->first()?->data_json['title'], 'status' => $e->is_archived ? 'archived' : $e->revisions->first()?->status, 'revision' => $e->revisions->first()?->number, 'updated_at' => $e->revisions->first()?->updated_at, 'legacy' => ! $e->is_managed]),
            'counts' => ContentRevision::selectRaw('status, count(*) as total')->whereHas('entry', fn ($q) => $q->where('is_archived', false))->whereRaw('number = (select max(r.number) from content_revisions r where r.content_entry_id = content_revisions.content_entry_id)')->groupBy('status')->pluck('total', 'status'),
            'users' => $section === 'users' ? User::when($r->filled('q'), fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', '%'.$r->input('q').'%')->orWhere('email', 'like', '%'.$r->input('q').'%')))->orderBy('id')->paginate(20)->through(fn ($u) => [...$u->only('id', 'name', 'email', 'role', 'suspended_at'), 'can_publish' => in_array('content.publish', $u->permission_grants ?? [])]) : null,
            'audit' => in_array('audit.read', StudioAccess::permissions($r->user())) ? DB::table('studio_audit_events')->latest('id')->limit($section === 'audit' ? 100 : 8)->get(['id', 'actor_id', 'action', 'subject_type', 'subject_id', 'metadata_json', 'created_at'])->map(fn ($row) => UtcPayload::row($row)) : [],
            'reviewQueue' => ContentRevision::where('status', 'in_review')->with('entry')->latest('updated_at')->limit(5)->get()->map(fn ($revision) => ['entry_id' => $revision->content_entry_id, 'title' => $revision->data_json['title'], 'author_id' => $revision->author_id, 'updated_at' => $revision->updated_at]),
            'choices' => $this->choices(),
        ]);
    }

    private function choices(): array
    {
        return ['paths' => DB::table('learning_paths')->where('catalog_visible', true)->get(['id', 'title']), 'modules' => DB::table('modules')->where('catalog_visible', true)->get(['id', 'title', 'learning_path_id']), 'lessons' => DB::table('lessons')->where('catalog_visible', true)->get(['id', 'title']), 'lessonEntries' => ContentEntry::where('kind', 'lesson')->where('is_archived', false)->where(fn ($q) => $q->whereNull('subject_id')->orWhereIn('id', ContentEntry::whereNotNull('parent_lesson_entry_id')->select('parent_lesson_entry_id')))->with('revisions')->get()->map(fn ($e) => ['id' => $e->id, 'title' => $e->revisions->first()?->data_json['title'] ?? $e->slug, 'published' => (bool) $e->published_revision_id]), 'categories' => DB::table('lab_categories')->get(['id', 'name']), 'reviewers' => User::whereIn('role', ['admin', 'reviewer'])->get(['id', 'name'])];
    }

    public function edit(Request $r, ContentEntry $entry)
    {
        $entry->load('revisions');

        return Inertia::render('StudioEditor', ['entry' => $entry->only('id', 'kind', 'slug', 'subject_id', 'is_managed', 'is_archived', 'published_revision_id'), 'revisions' => $entry->revisions, 'choices' => $this->choices(), 'reviews' => DB::table('editorial_reviews')->whereIn('content_revision_id', $entry->revisions->pluck('id'))->latest('id')->get(), 'saves' => DB::table('revision_saves')->whereIn('content_revision_id', $entry->revisions->pluck('id'))->latest('id')->limit(30)->get(['id', 'content_revision_id', 'lock_version', 'actor_id', 'created_at']), 'roadmapDefault' => $entry->kind === 'roadmap' ? null : []]);
    }

    public function create(Request $r, ContentWorkflow $workflow, ContentCatalog $catalog)
    {
        $r->validate(['kind' => ['required', Rule::in(ContentSchema::KINDS)], 'data' => 'required|array']);
        $revision = $workflow->create($r->user(), $r->input('kind'), $r->input('data'));

        return response()->json(['entry_id' => $revision->content_entry_id, 'revision' => $revision], 201);
    }

    public function draft(Request $r, ContentEntry $entry, ContentWorkflow $workflow)
    {
        $data = $r->validate(['from_revision_id' => 'nullable|integer']);

        return response()->json(['revision' => $workflow->draft($r->user(), $entry, $data['from_revision_id'] ?? null)]);
    }

    public function save(Request $r, ContentRevision $revision, ContentWorkflow $workflow)
    {
        $data = $r->validate(['version' => 'required|integer|min:1', 'data' => 'required|array']);

        return response()->json(['revision' => $workflow->save($r->user(), $revision, $data['data'], $data['version'])]);
    }

    private function transition(Request $r, ContentRevision $revision, ContentWorkflow $workflow, string $action)
    {
        $r->validate(['version' => 'required|integer|min:1']);

        return response()->json(['revision' => $workflow->transition($r->user(), $revision, $action, $r->integer('version'))]);
    }

    public function submit(Request $r, ContentRevision $revision, ContentWorkflow $workflow)
    {
        return $this->transition($r, $revision, $workflow, 'submit');
    }

    public function publish(Request $r, ContentRevision $revision, ContentWorkflow $workflow)
    {
        return $this->transition($r, $revision, $workflow, 'publish');
    }

    public function review(Request $r, ContentRevision $revision, ContentWorkflow $workflow)
    {
        $data = $r->validate(['version' => 'required|integer|min:1', 'decision' => 'required|in:approve,request_changes', 'notes' => 'required|string|min:3|max:10000', 'checks' => 'required|array:accuracy,clarity,safety,references,license', 'checks.*' => 'required|boolean']);

        return response()->json(['revision' => $workflow->transition($r->user(), $revision, $data['decision'], $data['version'], $data)]);
    }

    public function preview(Request $r, ContentRevision $revision, SafeMarkdown $markdown)
    {
        // Staff route only. Explicit learner DTO never serializes quiz choices' keys.
        $d = $revision->data_json;

        return response()->json(['title' => $d['title'], 'html' => $markdown->render($d['body_md'] ?? $d['scenario_md'] ?? $d['description'] ?? ''), 'questions' => collect($d['questions'] ?? [])->map(fn ($q) => ['question' => $q['question'], 'choices' => array_map(fn ($c) => ['text' => $c['text']], $q['choices'])])]);
    }

    public function archive(Request $r, ContentEntry $entry, ContentWorkflow $workflow)
    {
        $workflow->archive($r->user(), $entry);

        return response()->json(['message' => 'Konten diarsipkan; riwayat dan progres tetap tersimpan.']);
    }

    public function user(Request $r, User $user, AccountSecurity $security)
    {
        $data = $r->validate(['role' => ['required', Rule::in(StudioAccess::ROLES)], 'suspended' => 'required|boolean', 'can_publish' => 'required|boolean', 'current_password' => 'nullable|string|max:512']);
        $security->recent($r);
        $security->changeRole($r->user(), $user, $data['role'], $data['suspended'], $data['can_publish']);

        return response()->json(['message' => 'Izin akun tersimpan; sesi lama akun tersebut dihentikan.']);
    }
}

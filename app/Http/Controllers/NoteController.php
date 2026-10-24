<?php

namespace App\Http\Controllers;

use App\Models\LabSpec;
use App\Models\Lesson;
use App\Models\Note;
use App\Services\SafeMarkdown;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class NoteController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['search' => 'nullable|string|max:100', 'tag' => 'nullable|string|max:40', 'category' => 'nullable|string|max:60', 'lesson' => 'nullable|integer|exists:lessons,id']);
        $query = Note::where('user_id', $request->user()->id)->with('tags');
        if ($search = $request->string('search')->toString()) {
            $query->where(fn ($q) => $q->where('title', 'like', '%'.$search.'%')->orWhere('body_md', 'like', '%'.$search.'%'));
        }
        if ($tag = $request->input('tag')) {
            $query->whereHas('tags', fn ($q) => $q->where('name', $tag));
        }
        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }
        $notes = $query->orderByDesc('pinned')->orderByDesc('updated_at')->orderByDesc('id')->paginate(30)->withQueryString();

        return Inertia::render('Notes', ['notes' => $notes->through(fn ($n) => $this->payload($n)), 'filters' => $request->only('search', 'tag', 'category'), 'initialLesson' => $request->integer('lesson') ?: null, 'lessons' => Lesson::orderBy('sort_order')->get(['id', 'title']), 'labs' => LabSpec::all(['id', 'title']), 'tags' => DB::table('note_tags')->join('notes', 'notes.id', '=', 'note_tags.note_id')->where('notes.user_id', $request->user()->id)->distinct()->orderBy('name')->pluck('name'), 'categories' => Note::where('user_id', $request->user()->id)->distinct()->orderBy('category')->pluck('category')]);
    }

    public function show(Request $request, Note $note)
    {
        Gate::authorize('view', $note);

        return response()->json($this->payload($note));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $note = DB::transaction(function () use ($request, $data) {
            $note = new Note(collect($data)->except('tags', 'revision')->all());
            $note->user_id = $request->user()->id;
            $note->save();
            $this->tags($note, $data['tags']);

            return $note;
        });

        return response()->json($this->payload($note->fresh()), 201);
    }

    public function update(Request $request, Note $note)
    {
        Gate::authorize('update', $note);
        $data = $this->validated($request, true);

        return DB::transaction(function () use ($note, $data) {
            $current = Note::whereKey($note->id)->lockForUpdate()->firstOrFail();
            if ($current->revision !== $data['revision']) {
                return response()->json(['message' => 'Catatan berubah di tab lain. Salinan lokalmu belum disimpan.', 'current' => $this->payload($current)], 409);
            }
            $current->fill(collect($data)->except('tags', 'revision')->all());
            $current->revision++;
            $current->save();
            $this->tags($current, $data['tags']);

            return response()->json($this->payload($current));
        });
    }

    public function destroy(Request $request, Note $note)
    {
        Gate::authorize('delete', $note);
        $data = $request->validate(['revision' => 'required|integer|min:1']);

        return DB::transaction(function () use ($note, $data) {
            $current = Note::whereKey($note->id)->lockForUpdate()->firstOrFail();
            if ($current->revision !== $data['revision']) {
                return response()->json(['message' => 'Versi berubah; muat ulang sebelum menghapus.', 'current' => $this->payload($current)], 409);
            } $current->delete();

            return response()->noContent();
        });
    }

    public function preview(Request $request, SafeMarkdown $markdown)
    {
        $data = $request->validate(['body_md' => 'present|nullable|string|max:60000']);

        return response()->json(['html' => $markdown->render($data['body_md'] ?? '')]);
    }

    private function validated(Request $request, bool $update = false): array
    {
        $data = $request->validate(['title' => 'required|string|max:180', 'body_md' => 'present|nullable|string|max:60000', 'category' => 'required|string|max:60', 'pinned' => 'required|boolean', 'lesson_id' => 'nullable|integer|exists:lessons,id', 'lab_spec_id' => 'nullable|integer|exists:lab_specs,id', 'tags' => 'present|array|max:10', 'tags.*' => 'required|string|max:40|distinct', 'revision' => $update ? 'required|integer|min:1' : 'prohibited', 'user_id' => 'prohibited']);
        $data['body_md'] = $data['body_md'] ?? '';

        return $data;
    }

    private function tags(Note $note, array $tags): void
    {
        $note->tags()->delete();
        foreach ($tags as $name) {
            $note->tags()->create(['name' => $name]);
        } $note->unsetRelation('tags');
    }

    private function payload(Note $note): array
    {
        return [...$note->only(['id', 'title', 'body_md', 'category', 'pinned', 'revision', 'lesson_id', 'lab_spec_id', 'updated_at']), 'tags' => $note->tags->pluck('name')];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Lab;
use App\Models\LabProgress;
use App\Models\Lesson;
use App\Models\QuizAttempt;
use App\Services\LearningService;
use App\Services\SafeMarkdown;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LearningController extends Controller
{
    public function index(Request $request, LearningService $service)
    {
        return Inertia::render('Learning', ['courses' => $service->courses($request->user())]);
    }

    public function show(Request $request, Lesson $lesson, LearningService $service, SafeMarkdown $markdown)
    {
        $lesson->load('sources', 'labs', 'questions.choices');
        $interactive = Lab::where('lesson_id', $lesson->id)->get()->keyBy('lab_spec_id');
        $solved = LabProgress::where('user_id', $request->user()->id)->pluck('lab_id');
        $labLinks = $lesson->labs->map(function ($spec) use ($interactive, $solved) {
            $lab = $interactive->get($spec->id);

            return ['id' => $spec->id, 'title' => $lab?->title ?? $spec->title, 'goal' => $spec->goal, 'slug' => $lab?->slug, 'available' => (bool) $lab?->enabled && config('labs.enabled'), 'solved' => $lab && $solved->contains($lab->id)];
        });

        return Inertia::render('LessonReader', [
            'exampleHtml' => $markdown->render($lesson->enrichment['example_md'] ?? ''),
            'courses' => $service->courses($request->user()),
            'lesson' => ['id' => $lesson->id, 'slug' => $lesson->slug, 'title' => $lesson->title, 'html' => $markdown->render($lesson->body_md), 'enrichment' => $lesson->enrichment, 'minutes' => $lesson->estimated_minutes, 'sources' => $lesson->sources, 'labs' => $labLinks, 'authored_at' => $lesson->authored_at, 'reviewed_at' => $lesson->reviewed_at, 'editorial_status' => $lesson->editorial_status],
            'questions' => $lesson->questions->map(fn ($q) => ['id' => $q->id, 'question' => $q->question, 'choices' => $q->choices->shuffle()->map(fn ($c) => ['id' => $c->id, 'text' => $c->text])->values()]),
            'attempts' => QuizAttempt::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->latest('id')->limit(20)->get(['id', 'score', 'passed', 'feedback', 'created_at']),
        ]);
    }

    public function read(Request $request, Lesson $lesson, LearningService $service)
    {
        $request->validate(['user_id' => 'prohibited', 'completed_at' => 'prohibited', 'quiz_passed_at' => 'prohibited', 'lab_solved' => 'prohibited', 'skill_demonstrated' => 'prohibited']);
        $service->read($request->user(), $lesson);

        return back()->with('success', 'Bacaan tersimpan. Lanjutkan kuis untuk menyelesaikan lesson.');
    }

    public function quiz(Request $request, Lesson $lesson, LearningService $service)
    {
        $data = $request->validate(['submission_id' => 'required|uuid', 'answers' => 'required|array|max:50', 'answers.*' => 'required|array:question_id,choice_id', 'answers.*.question_id' => 'required|integer', 'answers.*.choice_id' => 'required|integer', 'score' => 'prohibited', 'passed' => 'prohibited', 'user_id' => 'prohibited', 'xp' => 'prohibited', 'lab_solved' => 'prohibited', 'skill_demonstrated' => 'prohibited']);

        return response()->json($service->grade($request->user(), $lesson, $data)->only(['id', 'score', 'passed', 'feedback', 'created_at']));
    }
}

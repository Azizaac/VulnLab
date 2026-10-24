<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoadmapPlanRequest;
use App\Http\Requests\TaskProgressRequest;
use App\Models\Phase;
use App\Models\RoadmapItem;
use App\Services\RoadmapService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoadmapController extends Controller
{
    public function dashboard(Request $request, RoadmapService $roadmap): Response
    {
        return Inertia::render('Dashboard', $roadmap->overview($request->user()));
    }

    public function index(Request $request, RoadmapService $roadmap, ?Phase $phase = null): Response
    {
        return Inertia::render('Roadmap', [
            ...$roadmap->overview($request->user()), 'selectedPhase' => $phase?->id,
            'search' => mb_substr((string) $request->query('search', ''), 0, 100),
        ]);
    }

    public function update(TaskProgressRequest $request, RoadmapItem $item, RoadmapService $roadmap): RedirectResponse
    {
        $roadmap->update($request->user(), $item, $request->validated('status'));

        return back()->with('success', $request->validated('status') === 'completed' ? 'Checklist direview. Progres tersimpan tanpa XP atau waktu terverifikasi.' : 'Tugas dimulai. Selamat belajar!');
    }

    public function plan(RoadmapPlanRequest $request, RoadmapService $roadmap): RedirectResponse
    {
        $data = $request->validated();
        if ($request->isMethod('patch')) {
            $roadmap->reschedule($request->user(), $data['starts_on'], $data['timezone']);
        } else {
            $roadmap->create($request->user(), $data['starts_on'], $data['timezone']);
        }

        return back()->with('success', 'Rencana 90 hari tersimpan. Progres yang sudah ada tetap dipertahankan.');
    }
}

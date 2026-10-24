<?php

namespace App\Http\Controllers;

use App\Services\ProgressService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgressController extends Controller
{
    public function index(Request $request, ProgressService $progress): Response
    {
        $data = $request->validate(['period' => 'nullable|in:7,30,90,all', 'user_id' => 'prohibited', 'xp' => 'prohibited', 'score' => 'prohibited']);

        return Inertia::render('Progress', ['progress' => $progress->overview($request->user(), $data['period'] ?? '7')]);
    }
}

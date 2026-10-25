<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\LabController;
use App\Http\Controllers\LearningController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\RoadmapController;
use App\Http\Controllers\ThemeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => redirect()->route(auth()->check() ? 'dashboard' : 'login'));
Route::middleware('guest')->group(function () {
    Route::get('/login', fn () => Inertia::render('Auth', ['mode' => 'login']))->name('login');
    Route::get('/register', fn () => Inertia::render('Auth', ['mode' => 'register']))->name('register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth-login');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth-register');
});
Route::middleware('auth')->group(function () {
    require __DIR__.'/v5.php';
    require __DIR__.'/sprint4-analytics.php';
    require __DIR__.'/sprint4-reports.php';
    Route::get('/labs', [LabController::class, 'index'])->name('labs');
    Route::get('/labs/{lab:slug}', [LabController::class, 'show'])->name('labs.show');
    Route::post('/labs/{lab:slug}/sessions', [LabController::class, 'start'])->middleware('throttle:lab-start');
    Route::post('/labs/{lab:slug}/hints', [LabController::class, 'hint'])->middleware('throttle:lab-hint');
    Route::post('/labs/{lab:slug}/solution', [LabController::class, 'solution'])->middleware('throttle:lab-solution');
    Route::post('/lab-sessions/{session}/request', [LabController::class, 'request'])->middleware('throttle:lab-request');
    Route::post('/lab-sessions/{session}/flag', [LabController::class, 'flag'])->middleware('throttle:lab-flag');
    Route::post('/lab-sessions/{session}/reset', [LabController::class, 'reset'])->middleware('throttle:lab-reset');
    Route::post('/lab-sessions/{session}/stop', [LabController::class, 'stop'])->middleware('throttle:lab-stop');
    Route::get('/learning', [LearningController::class, 'index'])->name('learning');
    Route::get('/learning/{lesson:slug}', [LearningController::class, 'show'])->name('learning.show');
    Route::post('/learning/{lesson:slug}/read', [LearningController::class, 'read'])->middleware('throttle:60,1');
    Route::post('/learning/{lesson:slug}/quiz', [LearningController::class, 'quiz'])->middleware('throttle:30,1');
    Route::get('/notes', [NoteController::class, 'index'])->name('notes');
    Route::post('/notes/preview', [NoteController::class, 'preview'])->middleware('throttle:120,1');
    Route::post('/notes', [NoteController::class, 'store'])->middleware('throttle:60,1');
    Route::get('/notes/{note}', [NoteController::class, 'show']);
    Route::patch('/notes/{note}', [NoteController::class, 'update'])->middleware('throttle:120,1');
    Route::delete('/notes/{note}', [NoteController::class, 'destroy'])->middleware('throttle:60,1');
    Route::patch('/settings/theme', [ThemeController::class, 'update'])->name('settings.theme');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/dashboard', [RoadmapController::class, 'dashboard'])->name('dashboard');
    Route::get('/roadmap', [RoadmapController::class, 'index'])->name('roadmap');
    Route::get('/roadmap/{phase}', [RoadmapController::class, 'index'])->name('roadmap.phase');
    Route::post('/roadmap/plan', [RoadmapController::class, 'plan'])->name('roadmap.plan.create');
    Route::patch('/roadmap/plan', [RoadmapController::class, 'plan'])->name('roadmap.plan.update');
    Route::patch('/roadmap/items/{item}', [RoadmapController::class, 'update'])->name('roadmap.items.update');
    Route::patch('/tasks/{task}/progress', fn () => abort(410, 'Roadmap diperbarui. Muat ulang halaman untuk memakai rencana pribadi.'));
});

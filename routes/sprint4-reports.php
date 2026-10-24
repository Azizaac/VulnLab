<?php

use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/reports', [ReportController::class, 'index'])->name('reports');
    Route::get('/reports/create', [ReportController::class, 'create'])->name('reports.create');
    Route::post('/reports', [ReportController::class, 'store'])->middleware('throttle:60,1');
    Route::get('/reports/{report}', [ReportController::class, 'show'])->name('reports.show');
    Route::get('/reports/{report}/edit', [ReportController::class, 'edit'])->name('reports.edit');
    Route::patch('/reports/{report}', [ReportController::class, 'update'])->middleware('throttle:120,1');
    Route::delete('/reports/{report}', [ReportController::class, 'destroy'])->middleware('throttle:30,1');
    Route::post('/reports/{report}/submit-for-review', [ReportController::class, 'submit'])->middleware('throttle:20,1');
    Route::post('/reports/{report}/evaluate', [ReportController::class, 'evaluate'])->middleware('throttle:20,1');
    Route::post('/reports/{report}/archive', [ReportController::class, 'archive'])->middleware('throttle:30,1');
    Route::post('/reports/{report}/evidence', [ReportController::class, 'upload'])->middleware('throttle:20,1');
    Route::delete('/reports/{report}/evidence/{evidence}', [ReportController::class, 'deleteEvidence'])->middleware('throttle:30,1');
    Route::get('/reports/{report}/evidence/{evidence}/download', [ReportController::class, 'download'])->middleware(['signed', 'throttle:60,1'])->name('reports.evidence.download');
    Route::get('/reports/{report}/export', [ReportController::class, 'export'])->middleware('throttle:30,1')->name('reports.export');
});

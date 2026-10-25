<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\StudioController;
use App\Http\Middleware\RecordStudioDenial;
use Illuminate\Support\Facades\Route;

Route::get('/profile', [AccountController::class, 'profile']);
Route::get('/profile/avatar', [AccountController::class, 'avatar']);
Route::post('/profile/avatar', [AccountController::class, 'uploadAvatar'])->middleware('throttle:10,1');
Route::get('/settings', fn () => redirect('/settings/general'));
Route::get('/settings/{section}', [AccountController::class, 'settings']);
Route::patch('/account/settings/{section}', [AccountController::class, 'save'])->middleware('throttle:40,1');
Route::post('/account/reauthenticate', [AccountController::class, 'reauthenticate'])->middleware('throttle:sensitive-account');
Route::post('/account/password', [AccountController::class, 'password'])->middleware('throttle:sensitive-account');
Route::post('/account/sessions/revoke', [AccountController::class, 'revoke'])->middleware('throttle:sensitive-account');
Route::post('/account/exports', [AccountController::class, 'export'])->middleware('throttle:sensitive-account');
Route::get('/account/exports/{id}', [AccountController::class, 'download'])->middleware('signed')->name('account.export');
Route::post('/account/deletion', [AccountController::class, 'deleteRequest'])->middleware('throttle:sensitive-account');
Route::delete('/account/deletion', [AccountController::class, 'cancelDeletion'])->middleware('throttle:sensitive-account');
Route::get('/notifications', [AccountController::class, 'notifications']);
Route::post('/notifications/{id}/read', [AccountController::class, 'readNotification']);

Route::prefix('studio')->middleware([RecordStudioDenial::class, 'can:studio.access', 'throttle:120,1'])->group(function () {
    Route::get('/', [StudioController::class, 'index']);
    Route::get('/content/{entry}/edit', [StudioController::class, 'edit']);
    Route::get('/revisions/{revision}/preview', [StudioController::class, 'preview']);
    Route::post('/content', [StudioController::class, 'create'])->middleware('can:content.edit');
    Route::post('/content/{entry}/draft', [StudioController::class, 'draft'])->middleware('can:content.edit');
    Route::patch('/revisions/{revision}', [StudioController::class, 'save'])->middleware('can:content.edit');
    Route::post('/revisions/{revision}/submit', [StudioController::class, 'submit'])->middleware('can:content.edit');
    Route::post('/revisions/{revision}/review', [StudioController::class, 'review'])->middleware('can:content.review');
    Route::post('/revisions/{revision}/publish', [StudioController::class, 'publish'])->middleware('can:content.publish');
    Route::post('/content/{entry}/archive', [StudioController::class, 'archive'])->middleware('can:content.publish');
    Route::patch('/users/{user}', [StudioController::class, 'user'])->middleware(['can:users.manage', 'throttle:sensitive-account']);
    Route::get('/{section}', [StudioController::class, 'index']);
});

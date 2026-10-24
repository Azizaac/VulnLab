<?php

use App\Http\Controllers\ProgressController;
use Illuminate\Support\Facades\Route;

// Included by web.php inside its authenticated group.
Route::get('/progress', [ProgressController::class, 'index'])->name('progress');

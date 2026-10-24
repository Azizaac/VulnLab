<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ThemeController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate(['theme' => ['required', Rule::in(['system', 'light', 'dark'])], 'user_id' => ['prohibited']]);
        $request->user()->forceFill(['theme' => $data['theme']])->save();

        return back();
    }
}

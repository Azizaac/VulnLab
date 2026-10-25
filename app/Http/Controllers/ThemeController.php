<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ThemeController extends Controller
{
    public function update(Request $request)
    {
        $data = $request->validate(['theme' => ['required', Rule::in(['system', 'light', 'dark'])], 'user_id' => ['prohibited']]);
        $request->user()->forceFill(['theme' => $data['theme']])->save();

        if ($request->expectsJson()) {
            return response()->json(['theme' => $data['theme']]);
        }

        return back();
    }
}

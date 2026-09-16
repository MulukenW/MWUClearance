<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Exception;

class SettingsController extends Controller
{
    /**
     * Get all settings (admin only).
     */
    public function index()
    {
        try {
            $settings = Setting::all()->map(function ($s) {
                $data = [
                    'key' => $s->key,
                    'value' => $s->value,
                    'type' => $s->type,
                    'label' => $s->label,
                    'group' => $s->group,
                ];
                // For file-type settings, include the URL
                if ($s->type === 'file' && $s->value) {
                    $data['url'] = Storage::url($s->value);
                }
                return $data;
            });

            return response()->json([
                'success' => true,
                'data' => $settings,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load settings',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update general settings (admin only).
     */
    public function update(Request $request)
    {
        try {
            $request->validate([
                'university_name' => 'nullable|string|max:255',
                'system_name' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:500',
                'phone' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:255',
                'website' => 'nullable|string|max:255',
            ]);

            $fields = ['university_name', 'system_name', 'address', 'phone', 'email', 'website'];
            foreach ($fields as $field) {
                if ($request->has($field)) {
                    Setting::set($field, $request->$field, 'text', ucfirst(str_replace('_', ' ', $field)), 'general');
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Settings updated successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Upload a new logo (admin only).
     */
    public function uploadLogo(Request $request)
    {
        try {
            $request->validate([
                'logo' => 'required|image|mimes:png,jpg,jpeg,svg,gif,webp|max:2048', // 2MB max
            ]);

            // Delete old logo if exists
            $oldPath = Setting::get('logo_path');
            if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }

            // Store new logo
            $path = $request->file('logo')->store('logos', 'public');

            // Save path to settings
            Setting::set('logo_path', $path, 'file', 'University Logo', 'branding');

            return response()->json([
                'success' => true,
                'message' => 'Logo uploaded successfully',
                'data' => [
                    'url' => Storage::url($path),
                    'path' => $path,
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload logo',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Delete the custom logo and revert to default (admin only).
     */
    public function deleteLogo()
    {
        try {
            $oldPath = Setting::get('logo_path');
            if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }

            Setting::set('logo_path', null, 'file', 'University Logo', 'branding');

            return response()->json([
                'success' => true,
                'message' => 'Logo removed, using default',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete logo',
            ], 500);
        }
    }

    public function uploadStamp(Request $request)
    {
        try {
            $request->validate([
                'stamp' => 'required|image|mimes:png,jpg,jpeg,gif,webp|max:2048',
            ]);

            $oldPath = Setting::get('stamp_path');
            if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('stamp')->store('stamps', 'public');
            Setting::set('stamp_path', $path, 'file', 'University Stamp', 'branding');

            return response()->json([
                'success' => true,
                'message' => 'Stamp uploaded successfully',
                'data' => ['url' => Storage::url($path), 'path' => $path],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload stamp',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function deleteStamp()
    {
        try {
            $oldPath = Setting::get('stamp_path');
            if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
            Setting::set('stamp_path', null, 'file', 'University Stamp', 'branding');

            return response()->json(['success' => true, 'message' => 'Stamp removed']);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to remove stamp'], 500);
        }
    }

    /**
     * Serve the current logo (public — no auth required).
     * Returns the custom uploaded logo or the default SVG.
     */
    public function logo()
    {
        $headers = [
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];

        $logoPath = Setting::get('logo_path');

        if ($logoPath && Storage::disk('public')->exists($logoPath)) {
            $file = storage_path('app/public/' . $logoPath);
            $mime = mime_content_type($file);
            $headers['Content-Type'] = $mime;
            return response()->file($file, $headers);
        }

        // Fallback to default logo (PNG first, then SVG)
        $defaultLogoPng = public_path('mwu-logo.png');
        if (file_exists($defaultLogoPng)) {
            $headers['Content-Type'] = 'image/png';
            return response()->file($defaultLogoPng, $headers);
        }
        $defaultLogoSvg = public_path('mwu-logo.svg');
        if (file_exists($defaultLogoSvg)) {
            $headers['Content-Type'] = 'image/svg+xml';
            return response()->file($defaultLogoSvg, $headers);
        }

        abort(404);
    }

    public function stamp()
    {
        $stampPath = Setting::get('stamp_path');
        if ($stampPath && Storage::disk('public')->exists($stampPath)) {
            $file = storage_path('app/public/' . $stampPath);
            return response()->file($file, [
                'Content-Type' => mime_content_type($file),
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
            ]);
        }

        abort(404);
    }
}

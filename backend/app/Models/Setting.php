<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'label', 'group'];

    /**
     * Get a setting value by key, with optional default.
     */
    public static function get(string $key, $default = null)
    {
        $cacheKey = "setting.{$key}";
        return Cache::remember($cacheKey, 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, $value, string $type = 'text', ?string $label = null, string $group = 'general')
    {
        $setting = static::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'type' => $type, 'label' => $label, 'group' => $group]
        );
        Cache::forget("setting.{$key}");
        return $setting;
    }

    /**
     * Get the full URL for a file-type setting (e.g. logo).
     */
    public static function getFileUrl(string $key): ?string
    {
        $path = static::get($key);
        if (!$path) return null;
        return Storage::url($path);
    }

    /**
     * Get all settings grouped.
     */
    public static function getAll(): array
    {
        return static::all()->groupBy('group')->map(function ($items) {
            return $items->mapWithKeys(function ($item) {
                return [$item->key => [
                    'value' => $item->value,
                    'type' => $item->type,
                    'label' => $item->label,
                    'group' => $item->group,
                ]];
            });
        })->toArray();
    }
}

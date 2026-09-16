<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebAuthnCredential extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'credential_id',
        'public_key',
        'aaguid',
        'sign_count',
        'device_name',
        'last_used_at',
    ];

    protected $casts = [
        'sign_count' => 'integer',
        'last_used_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

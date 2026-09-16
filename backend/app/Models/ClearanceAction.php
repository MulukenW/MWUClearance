<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClearanceAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'clearance_item_id',
        'user_id',
        'action',
        'comment',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    // Relationships
    public function clearanceItem()
    {
        return $this->belongsTo(ClearanceItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

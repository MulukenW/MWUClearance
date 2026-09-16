<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClearanceComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'clearance_item_id',
        'user_id',
        'comment',
        'is_internal',
    ];

    protected $casts = [
        'is_internal' => 'boolean',
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

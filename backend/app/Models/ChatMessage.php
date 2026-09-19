<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'clearance_request_id',
        'clearance_item_id',
        'sender_id',
        'message',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    // Relationships
    public function clearanceRequest()
    {
        return $this->belongsTo(ClearanceRequest::class);
    }

    public function clearanceItem()
    {
        return $this->belongsTo(ClearanceItem::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class);
    }
}

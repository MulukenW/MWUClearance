<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClearanceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'clearance_request_id',
        'clearance_office_id',
        'step_order',
        'is_required',
        'status',
        'rejection_reason',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'step_order' => 'integer',
        'processed_at' => 'datetime',
    ];

    // Relationships
    public function clearanceRequest()
    {
        return $this->belongsTo(ClearanceRequest::class);
    }

    public function clearanceOffice()
    {
        return $this->belongsTo(ClearanceOffice::class);
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function actions()
    {
        return $this->hasMany(ClearanceAction::class);
    }

    public function comments()
    {
        return $this->hasMany(ClearanceComment::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClearanceRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'clearance_number',
        'status',
        'purpose',
        'program_type',
        'reason_for_clearance',
        'reason_other',
        'police_location',
        'academic_year',
        'submitted_at',
        'completed_at',
    ];

    protected $casts = [
        'submitted_at' => 'date',
        'completed_at' => 'date',
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function clearanceItems()
    {
        return $this->hasMany(ClearanceItem::class);
    }

    public function certificate()
    {
        return $this->hasOne(Certificate::class);
    }

    // Helper method to get progress percentage
    public function getProgressPercentageAttribute()
    {
        $total = $this->clearanceItems()->where('is_required', true)->count();
        if ($total === 0) {
            return 0;
        }

        $approved = $this->clearanceItems()
            ->where('is_required', true)
            ->where('status', 'approved')
            ->count();

        return round(($approved / $total) * 100);
    }
}

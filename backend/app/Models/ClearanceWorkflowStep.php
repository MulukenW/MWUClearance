<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClearanceWorkflowStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_type_id',
        'clearance_office_id',
        'step_order',
        'is_required',
        'is_active',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_active' => 'boolean',
        'step_order' => 'integer',
    ];

    // Relationships
    public function studentType()
    {
        return $this->belongsTo(StudentType::class);
    }

    public function clearanceOffice()
    {
        return $this->belongsTo(ClearanceOffice::class);
    }
}

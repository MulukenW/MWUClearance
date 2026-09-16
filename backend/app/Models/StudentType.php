<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function workflowSteps()
    {
        return $this->hasMany(ClearanceWorkflowStep::class);
    }
}

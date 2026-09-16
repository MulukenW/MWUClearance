<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClearanceOffice extends Model
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
    public function workflowSteps()
    {
        return $this->hasMany(ClearanceWorkflowStep::class);
    }

    public function clearanceItems()
    {
        return $this->hasMany(ClearanceItem::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}

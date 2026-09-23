<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'department_id',
        'college_id',
        'clearance_office_id',
        'status',
        'must_change_password',
    ];

    /**
     * Scope constants for officer authorization:
     * department-level roles see only their department's students,
     * college-level roles see every department of their college,
     * and officers with neither see everything (central offices).
     */
    public const DEPARTMENT_LEVEL_ROLES = ['advisor', 'department_head', 'laboratory', 'student'];
    public const COLLEGE_LEVEL_ROLES = ['continuing_education'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    // Relationships
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function college()
    {
        return $this->belongsTo(College::class);
    }

    public function clearanceOffice()
    {
        return $this->belongsTo(ClearanceOffice::class);
    }

    public function student()
    {
        return $this->hasOne(Student::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function webAuthnCredentials()
    {
        return $this->hasMany(WebAuthnCredential::class);
    }

    // Helper method to check if user has permission
    public function hasPermission($permissionCode)
    {
        return $this->role && $this->role->permissions()->where('code', $permissionCode)->exists();
    }

    // Helper method to check if user has role
    public function hasRole($roleCode)
    {
        return $this->role && $this->role->code === $roleCode;
    }
}

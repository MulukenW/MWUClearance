<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'clearance_request_id',
        'certificate_number',
        'verification_code',
        'qr_code_path',
        'pdf_path',
        'issued_date',
        'issued_by',
    ];

    protected $casts = [
        'issued_date' => 'date',
    ];

    // Relationships
    public function clearanceRequest()
    {
        return $this->belongsTo(ClearanceRequest::class);
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}

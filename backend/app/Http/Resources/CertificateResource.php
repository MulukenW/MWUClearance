<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CertificateResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'certificate_number' => $this->certificate_number,
            'verification_code' => $this->verification_code,
            'issued_date' => $this->issued_date ? $this->issued_date->format('Y-m-d') : null,
            'issued_by' => $this->when($this->relationLoaded('issuedBy') && $this->issuedBy, function () {
                return [
                    'id' => $this->issuedBy->id,
                    'name' => $this->issuedBy->name,
                ];
            }),
            'clearance_request' => $this->when($this->relationLoaded('clearanceRequest'), function () {
                $cr = $this->clearanceRequest;
                $student = $cr->relationLoaded('student') ? $cr->student : null;
                return [
                    'id' => $cr->id,
                    'clearance_number' => $cr->clearance_number,
                    'status' => $cr->status,
                    'student' => $student ? [
                        'id' => $student->id,
                        'student_id' => $student->student_id,
                        'full_name' => $student->full_name,
                        'department' => $student->relationLoaded('department') && $student->department ? [
                            'id' => $student->department->id,
                            'name' => $student->department->name,
                            'code' => $student->department->code,
                        ] : null,
                        'program' => $student->relationLoaded('program') && $student->program ? [
                            'id' => $student->program->id,
                            'name' => $student->program->name,
                        ] : null,
                        'student_type' => $student->relationLoaded('studentType') && $student->studentType ? [
                            'id' => $student->studentType->id,
                            'name' => $student->studentType->name,
                        ] : null,
                        'academic_year' => $student->academic_year,
                    ] : null,
                ];
            }),
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toISOString() : null,
        ];
    }
}

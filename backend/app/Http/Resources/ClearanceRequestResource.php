<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ClearanceRequestResource extends JsonResource
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
            'clearance_number' => $this->clearance_number,
            'status' => $this->status,
            'purpose' => $this->purpose,
            'program_type' => $this->program_type,
            'reason_for_clearance' => $this->reason_for_clearance,
            'reason_other' => $this->reason_other,
            'police_location' => $this->police_location,
            'academic_year' => $this->academic_year,
            'submitted_at' => $this->submitted_at ? $this->submitted_at->format('Y-m-d H:i:s') : null,
            'completed_at' => $this->completed_at ? $this->completed_at->format('Y-m-d H:i:s') : null,
            'progress_percentage' => $this->progress_percentage ?? 0,
            'student' => $this->when($this->student, [
                'id' => $this->student->id ?? null,
                'student_id' => $this->student->student_id ?? null,
                'full_name' => $this->student->full_name ?? null,
                'email' => $this->student->email ?? null,
                'phone' => $this->student->phone ?? null,
                'student_type' => [
                    'id' => $this->student->studentType->id ?? null,
                    'name' => $this->student->studentType->name ?? null,
                    'code' => $this->student->studentType->code ?? null,
                ],
                'department' => [
                    'id' => $this->student->department->id ?? null,
                    'name' => $this->student->department->name ?? null,
                    'code' => $this->student->department->code ?? null,
                ],
                'program' => [
                    'id' => $this->student->program->id ?? null,
                    'name' => $this->student->program->name ?? null,
                    'code' => $this->student->program->code ?? null,
                ],
            ]),
            'clearance_items' => ClearanceItemResource::collection($this->whenLoaded('clearanceItems')),
            'certificate' => $this->when($this->certificate, [
                'id' => optional($this->certificate)->id,
                'certificate_number' => optional($this->certificate)->certificate_number,
                'verification_code' => optional($this->certificate)->verification_code,
                'issued_date' => optional($this->certificate)->issued_date ? $this->certificate->issued_date->format('Y-m-d') : null,
            ]),
            'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
            'updated_at' => $this->updated_at ? $this->updated_at->format('Y-m-d H:i:s') : null,
        ];
    }
}

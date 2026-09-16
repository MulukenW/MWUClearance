<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => trim(implode(' ', array_filter([
                $this->first_name,
                $this->middle_name,
                $this->last_name,
            ]))),
            'phone' => $this->phone,
            'address' => $this->address,
            'academic_year' => $this->academic_year,
            'status' => $this->status,
            
            // User relationship
            'user' => $this->when($this->relationLoaded('user'), function() {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'email_verified_at' => $this->user->email_verified_at,
                ];
            }),
            
            // Department relationship
            'department' => $this->when($this->relationLoaded('department'), function() {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                    'code' => $this->department->code,
                    'college' => $this->when($this->department->relationLoaded('college'), function() {
                        return [
                            'id' => $this->department->college->id,
                            'name' => $this->department->college->name,
                            'code' => $this->department->college->code,
                        ];
                    }),
                ];
            }),
            
            // Program relationship
            'program' => $this->when($this->relationLoaded('program'), function() {
                return [
                    'id' => $this->program->id,
                    'name' => $this->program->name,
                    'code' => $this->program->code,
                    'level' => $this->program->level,
                ];
            }),
            
            // Student Type relationship
            'student_type' => $this->when($this->relationLoaded('studentType'), function() {
                return [
                    'id' => $this->studentType->id,
                    'name' => $this->studentType->name,
                    'code' => $this->studentType->code,
                ];
            }),
            
            // Clearance Requests relationship
            'clearance_requests' => $this->when($this->relationLoaded('clearanceRequests'), function() {
                return ClearanceRequestResource::collection($this->clearanceRequests);
            }),
            
            // Timestamps
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toISOString() : null,
        ];
    }
}

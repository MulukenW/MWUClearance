<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'status' => $this->status,
            'role_id' => $this->role_id,
            'department_id' => $this->department_id,
            'clearance_office_id' => $this->clearance_office_id,

            // Role (single role via role_id foreign key)
            'role' => $this->when($this->relationLoaded('role') && $this->role, function () {
                return [
                    'id' => $this->role->id,
                    'name' => $this->role->name,
                    'code' => $this->role->code,
                    'description' => $this->role->description,
                ];
            }),

            // Department relationship
            'department' => $this->when($this->relationLoaded('department') && $this->department, function () {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                    'code' => $this->department->code,
                    'college' => $this->when(
                        $this->department->relationLoaded('college') && $this->department->college,
                        function () {
                            return [
                                'id' => $this->department->college->id,
                                'name' => $this->department->college->name,
                                'code' => $this->department->college->code,
                            ];
                        }
                    ),
                ];
            }),

            // Clearance Office relationship
            'clearance_office' => $this->when($this->relationLoaded('clearanceOffice') && $this->clearanceOffice, function () {
                return [
                    'id' => $this->clearanceOffice->id,
                    'name' => $this->clearanceOffice->name,
                    'code' => $this->clearanceOffice->code,
                ];
            }),

            // Student relationship (if user is a student)
            'student' => $this->when($this->relationLoaded('student') && $this->student, function () {
                return [
                    'id' => $this->student->id,
                    'student_id' => $this->student->student_id,
                    'first_name' => $this->student->first_name,
                    'middle_name' => $this->student->middle_name,
                    'last_name' => $this->student->last_name,
                    'full_name' => trim(implode(' ', array_filter([
                        $this->student->first_name,
                        $this->student->middle_name,
                        $this->student->last_name,
                    ]))),
                    'academic_year' => $this->student->academic_year,
                    'admission_year' => $this->student->admission_year,
                    'department_id' => $this->student->department_id,
                    'college_id' => $this->student->college_id,
                    'program_id' => $this->student->program_id,
                    'status' => $this->student->status,
                    'department' => $this->when($this->student->relationLoaded('department') && $this->student->department, function () {
                        return [
                            'id' => $this->student->department->id,
                            'name' => $this->student->department->name,
                            'code' => $this->student->department->code,
                            'college' => $this->when($this->student->department->relationLoaded('college') && $this->student->department->college, function () {
                                return [
                                    'id' => $this->student->department->college->id,
                                    'name' => $this->student->department->college->name,
                                    'code' => $this->student->department->college->code,
                                ];
                            }),
                        ];
                    }),
                    'college' => $this->when($this->student->relationLoaded('college') && $this->student->college, function () {
                        return [
                            'id' => $this->student->college->id,
                            'name' => $this->student->college->name,
                            'code' => $this->student->college->code,
                        ];
                    }),
                    'program' => $this->when($this->student->relationLoaded('program') && $this->student->program, function () {
                        return [
                            'id' => $this->student->program->id,
                            'name' => $this->student->program->name,
                            'code' => $this->student->program->code,
                            'level' => $this->student->program->level,
                        ];
                    }),
                    'student_type' => $this->when($this->student->relationLoaded('studentType'), function () {
                        return [
                            'id' => $this->student->studentType->id,
                            'name' => $this->student->studentType->name,
                            'code' => $this->student->studentType->code,
                        ];
                    }),
                ];
            }),

            // Timestamps
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toISOString() : null,
        ];
    }
}

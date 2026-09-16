<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ClearanceWorkflowStepResource extends JsonResource
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
            'student_type_id' => $this->student_type_id,
            'clearance_office_id' => $this->clearance_office_id,
            'step_order' => $this->step_order,
            'is_required' => (bool) $this->is_required,
            'is_active' => (bool) $this->is_active,
            'student_type' => $this->when($this->relationLoaded('studentType') && $this->studentType, function () {
                return [
                    'id' => $this->studentType->id,
                    'name' => $this->studentType->name,
                    'code' => $this->studentType->code,
                ];
            }),
            'clearance_office' => $this->when($this->relationLoaded('clearanceOffice') && $this->clearanceOffice, function () {
                return [
                    'id' => $this->clearanceOffice->id,
                    'name' => $this->clearanceOffice->name,
                    'code' => $this->clearanceOffice->code,
                ];
            }),
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toISOString() : null,
        ];
    }
}

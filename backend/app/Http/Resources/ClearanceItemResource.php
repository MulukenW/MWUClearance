<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ClearanceItemResource extends JsonResource
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
            'step_order' => $this->step_order,
            'is_required' => $this->is_required,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'processed_at' => $this->processed_at ? $this->processed_at->format('Y-m-d H:i:s') : null,
            'clearance_office' => $this->whenLoaded('clearanceOffice', function() {
                return [
                    'id' => $this->clearanceOffice->id,
                    'name' => $this->clearanceOffice->name,
                    'code' => $this->clearanceOffice->code,
                ];
            }),
            'clearance' => $this->whenLoaded('clearanceRequest', function() {
                $cr = $this->clearanceRequest;
                return [
                    'id' => $cr->id,
                    'clearance_number' => $cr->clearance_number,
                    'status' => $cr->status,
                    'created_at' => $cr->created_at ? $cr->created_at->format('Y-m-d H:i:s') : null,
                    'student' => $this->when($cr->relationLoaded('student'), function() use ($cr) {
                        $student = $cr->student;
                        if (!$student) return null;
                        return [
                            'id' => $student->id,
                            'student_id' => $student->student_id,
                            'name' => $student->full_name,
                            'department' => $student->relationLoaded('department') && $student->department ? [
                                'id' => $student->department->id,
                                'name' => $student->department->name,
                            ] : null,
                            'student_type' => $student->relationLoaded('studentType') && $student->studentType ? [
                                'id' => $student->studentType->id,
                                'name' => $student->studentType->name,
                            ] : null,
                        ];
                    }),
                    'clearance_items' => $this->when($cr->relationLoaded('clearanceItems'), function() use ($cr) {
                        return $cr->clearanceItems->map(function($item) {
                            return [
                                'id' => $item->id,
                                'step_order' => $item->step_order,
                                'is_required' => $item->is_required,
                                'status' => $item->status,
                                'rejection_reason' => $item->rejection_reason,
                                'processed_at' => $item->processed_at ? $item->processed_at->format('Y-m-d H:i:s') : null,
                                'clearance_office' => $item->clearanceOffice ? [
                                    'id' => $item->clearanceOffice->id,
                                    'name' => $item->clearanceOffice->name,
                                    'code' => $item->clearanceOffice->code,
                                ] : null,
                                'created_at' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null,
                            ];
                        });
                    }),
                ];
            }),
            'processed_by' => $this->when($this->processedBy, [
                'id' => $this->processedBy->id ?? null,
                'name' => $this->processedBy->name ?? null,
            ]),
            'actions' => $this->when($this->actions, function() {
                return $this->actions->map(function($action) {
                    return [
                        'id' => $action->id,
                        'action' => $action->action,
                        'comment' => $action->comment,
                        'user' => [
                            'id' => $action->user->id,
                            'name' => $action->user->name,
                        ],
                        'created_at' => $action->created_at ? $action->created_at->format('Y-m-d H:i:s') : null,
                    ];
                });
            }),
            'comments' => $this->when($this->comments, function() {
                return $this->comments->map(function($comment) {
                    return [
                        'id' => $comment->id,
                        'comment' => $comment->comment,
                        'is_internal' => $comment->is_internal,
                        'user' => [
                            'id' => $comment->user->id,
                            'name' => $comment->user->name,
                        ],
                        'created_at' => $comment->created_at ? $comment->created_at->format('Y-m-d H:i:s') : null,
                    ];
                });
            }),
            'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
            'updated_at' => $this->updated_at ? $this->updated_at->format('Y-m-d H:i:s') : null,
        ];
    }
}

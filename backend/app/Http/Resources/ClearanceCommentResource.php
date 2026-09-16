<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ClearanceCommentResource extends JsonResource
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
            'clearance_item_id' => $this->clearance_item_id,
            'user_id' => $this->user_id,
            'comment' => $this->comment,
            'is_internal' => (bool) $this->is_internal,
            'user' => $this->when($this->relationLoaded('user') && $this->user, function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'role' => $this->when(
                        $this->user->relationLoaded('role') && $this->user->role,
                        function () {
                            return [
                                'id' => $this->user->role->id,
                                'name' => $this->user->role->name,
                                'code' => $this->user->role->code,
                            ];
                        }
                    ),
                ];
            }),
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toISOString() : null,
        ];
    }
}

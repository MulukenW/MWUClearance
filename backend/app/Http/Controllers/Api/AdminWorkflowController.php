<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClearanceWorkflowStep;
use App\Models\StudentType;
use App\Models\ClearanceOffice;
use App\Http\Resources\ClearanceWorkflowStepResource;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Exception;

class AdminWorkflowController extends Controller
{
    /**
     * Get all workflows grouped by student type
     */
    public function index()
    {
        $studentTypes = StudentType::orderBy('name')->get();
        $offices = ClearanceOffice::where('is_active', true)->orderBy('id')->get();

        $workflows = [];
        foreach ($studentTypes as $type) {
            $steps = ClearanceWorkflowStep::where('student_type_id', $type->id)
                ->with('clearanceOffice:id,name,code')
                ->orderBy('step_order')
                ->get();

            $workflows[] = [
                'student_type' => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'code' => $type->code,
                    'is_active' => (bool) $type->is_active,
                ],
                'steps' => ClearanceWorkflowStepResource::collection($steps),
                'total_steps' => $steps->count(),
                'required_steps' => $steps->where('is_required', true)->count(),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'workflows' => $workflows,
                'available_offices' => $offices->map(function ($office) {
                    return [
                        'id' => $office->id,
                        'name' => $office->name,
                        'code' => $office->code,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Get workflow steps for a specific student type
     */
    public function show($studentTypeId)
    {
        $studentType = StudentType::findOrFail($studentTypeId);

        $steps = ClearanceWorkflowStep::where('student_type_id', $studentTypeId)
            ->with('clearanceOffice:id,name,code')
            ->orderBy('step_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'student_type' => [
                    'id' => $studentType->id,
                    'name' => $studentType->name,
                    'code' => $studentType->code,
                ],
                'steps' => ClearanceWorkflowStepResource::collection($steps),
            ],
        ]);
    }

    /**
     * Save a complete workflow configuration for a student type.
     * Replaces the entire workflow for the given student type.
     *
     * Request body:
     * {
     *   "student_type_id": 1,
     *   "steps": [
     *     { "clearance_office_id": 1, "step_order": 1, "is_required": true },
     *     { "clearance_office_id": 2, "step_order": 2, "is_required": true },
     *     ...
     *   ]
     * }
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_type_id' => 'required|exists:student_types,id',
            'steps' => 'required|array|min:1',
            'steps.*.clearance_office_id' => 'required|exists:clearance_offices,id',
            'steps.*.step_order' => 'required|integer|min:1',
            'steps.*.is_required' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $studentType = StudentType::findOrFail($request->student_type_id);
        $steps = collect($request->steps)->sortBy('step_order')->values();

        // Validate step_order values are sequential starting from 1
        for ($i = 0; $i < $steps->count(); $i++) {
            if ($steps[$i]['step_order'] !== $i + 1) {
                return response()->json([
                    'success' => false,
                    'message' => "Step order values must be sequential starting from 1. Expected {$i} at position {$i}, got {$steps[$i]['step_order']}.",
                ], 422);
            }
        }

        // Validate no duplicate clearance offices
        $officeIds = $steps->pluck('clearance_office_id');
        if ($officeIds->unique()->count() !== $officeIds->count()) {
            return response()->json([
                'success' => false,
                'message' => 'Each clearance office can only appear once in the workflow.',
            ], 422);
        }

        // Validate all clearance offices exist and are active
        $validOfficeIds = ClearanceOffice::where('is_active', true)->pluck('id');
        foreach ($officeIds as $officeId) {
            if (!$validOfficeIds->contains($officeId)) {
                $office = ClearanceOffice::find($officeId);
                return response()->json([
                    'success' => false,
                    'message' => "Clearance office '{$office->name}' is not active or does not exist.",
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            // Delete existing workflow steps for this student type
            $deletedCount = ClearanceWorkflowStep::where('student_type_id', $studentType->id)->delete();

            // Create new workflow steps
            foreach ($steps as $step) {
                ClearanceWorkflowStep::create([
                    'student_type_id' => $studentType->id,
                    'clearance_office_id' => $step['clearance_office_id'],
                    'step_order' => $step['step_order'],
                    'is_required' => $step['is_required'],
                    'is_active' => true,
                ]);
            }

            AuditLogService::log(
                'workflow_updated',
                "Workflow updated for student type: {$studentType->name} ({$steps->count()} steps, {$deletedCount} old steps removed)",
                'App\Models\ClearanceWorkflowStep',
                null,
                [
                    'student_type_id' => $studentType->id,
                    'student_type_name' => $studentType->name,
                    'step_count' => $steps->count(),
                ]
            );

            DB::commit();

            // Return updated workflow
            $newSteps = ClearanceWorkflowStep::where('student_type_id', $studentType->id)
                ->with('clearanceOffice:id,name,code')
                ->orderBy('step_order')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Workflow saved successfully',
                'data' => [
                    'student_type' => [
                        'id' => $studentType->id,
                        'name' => $studentType->name,
                        'code' => $studentType->code,
                    ],
                    'steps' => ClearanceWorkflowStepResource::collection($newSteps),
                    'total_steps' => $newSteps->count(),
                    'required_steps' => $newSteps->where('is_required', true)->count(),
                ],
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to save workflow: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a single workflow step
     */
    public function update(Request $request, $id)
    {
        $step = ClearanceWorkflowStep::with('studentType', 'clearanceOffice')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'is_required' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
            'step_order' => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // If changing step_order, check for conflicts
        if ($request->filled('step_order')) {
            $conflict = ClearanceWorkflowStep::where('student_type_id', $step->student_type_id)
                ->where('step_order', $request->step_order)
                ->where('id', '!=', $id)
                ->exists();

            if ($conflict) {
                return response()->json([
                    'success' => false,
                    'message' => "A workflow step with order {$request->step_order} already exists for this student type.",
                ], 422);
            }
        }

        $step->update($request->only(['is_required', 'is_active', 'step_order']));

        AuditLogService::log(
            'workflow_step_updated',
            "Workflow step updated: {$step->clearanceOffice->name} (Order: {$step->step_order}) for {$step->studentType->name}",
            'App\Models\ClearanceWorkflowStep',
            $step->id,
            $request->only(['is_required', 'is_active', 'step_order'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Workflow step updated successfully',
            'data' => new ClearanceWorkflowStepResource($step->fresh(['studentType', 'clearanceOffice'])),
        ]);
    }

    /**
     * Delete a workflow step
     */
    public function destroy($id)
    {
        $step = ClearanceWorkflowStep::with('studentType', 'clearanceOffice')->findOrFail($id);

        $studentTypeName = $step->studentType->name;
        $officeName = $step->clearanceOffice->name;
        $stepOrder = $step->step_order;
        $studentTypeId = $step->student_type_id;

        $step->delete();

        // Reorder remaining steps to maintain sequential order
        $remaining = ClearanceWorkflowStep::where('student_type_id', $studentTypeId)
            ->orderBy('step_order')
            ->get();

        $order = 1;
        foreach ($remaining as $s) {
            if ($s->step_order !== $order) {
                $s->update(['step_order' => $order]);
            }
            $order++;
        }

        AuditLogService::log(
            'workflow_step_deleted',
            "Workflow step deleted: {$officeName} (Order: {$stepOrder}) from {$studentTypeName}",
            'App\Models\ClearanceWorkflowStep',
            $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Workflow step deleted and remaining steps reordered successfully',
        ]);
    }

    /**
     * Reset workflow to default configuration for a student type
     */
    public function resetToDefault($studentTypeId)
    {
        $studentType = StudentType::findOrFail($studentTypeId);

        // Get all active offices
        $offices = ClearanceOffice::where('is_active', true)->orderBy('id')->get();

        if ($offices->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No active clearance offices configured. Create offices first.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Delete existing steps
            ClearanceWorkflowStep::where('student_type_id', $studentType->id)->delete();

            // Default workflow rules:
            // - Regular students: Continuing Education is not required
            // - Extension / Summer / Winter students: Continuing Education is required
            // - Dormitory is not required for extension/weekend-type tracks
            $studentTypeCode = strtolower($studentType->code);
            $isExtension = in_array($studentTypeCode, ['extension', 'extension_weekend', 'extension/weekend']);
            $isContinuingEducationTrack = in_array($studentTypeCode, ['extension', 'summer', 'winter']);
            $isRegular = $studentTypeCode === 'regular';

            $order = 1;
            foreach ($offices as $office) {
                $isRequired = true;

                // Dormitory is NOT required for extension/weekend students
                if ($isExtension && in_array(strtolower($office->code), ['dormitory', 'dormitory_student_services'])) {
                    $isRequired = false;
                }

                // Continuing Education is only required for extension, summer and winter program tracks.
                if (strtolower($office->code) === 'continuing_education' && ($isRegular || !$isContinuingEducationTrack)) {
                    $isRequired = false;
                }

                ClearanceWorkflowStep::create([
                    'student_type_id' => $studentType->id,
                    'clearance_office_id' => $office->id,
                    'step_order' => $order,
                    'is_required' => $isRequired,
                    'is_active' => true,
                ]);

                $order++;
            }

            AuditLogService::log(
                'workflow_reset',
                "Workflow reset to default for student type: {$studentType->name}",
                'App\Models\ClearanceWorkflowStep',
                null,
                ['student_type_id' => $studentType->id, 'student_type_name' => $studentType->name]
            );

            DB::commit();

            // Return new workflow
            $newSteps = ClearanceWorkflowStep::where('student_type_id', $studentType->id)
                ->with('clearanceOffice:id,name,code')
                ->orderBy('step_order')
                ->get();

            return response()->json([
                'success' => true,
                'message' => "Workflow reset to default for {$studentType->name}",
                'data' => [
                    'student_type' => [
                        'id' => $studentType->id,
                        'name' => $studentType->name,
                        'code' => $studentType->code,
                    ],
                    'steps' => ClearanceWorkflowStepResource::collection($newSteps),
                    'total_steps' => $newSteps->count(),
                    'required_steps' => $newSteps->where('is_required', true)->count(),
                ],
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset workflow: ' . $e->getMessage(),
            ], 500);
        }
    }
}

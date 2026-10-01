import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function WorkflowConfig() {
  const [studentTypes, setStudentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [steps, setSteps] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.studentTypes().catch(() => ({ data: { data: [] } })),
      adminApi.clearanceOffices().catch(() => ({ data: { data: [] } })),
    ])
      .then(([typesRes, officesRes]) => {
        const types = typesRes.data?.data?.data || typesRes.data?.data || [];
        const officeList =
          officesRes.data?.data?.data || officesRes.data?.data || [];
        // Sort types so Regular (id 1) or lowest id is first
        const sortedTypes = Array.isArray(types)
          ? [...types].sort((a, b) => a.id - b.id)
          : [];
        setStudentTypes(sortedTypes);
        setOffices(Array.isArray(officeList) ? officeList : []);
        if (sortedTypes.length > 0) setSelectedType(sortedTypes[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedType) return;
    setStepsLoading(true);
    setMessage("");
    adminApi
      .workflowByType(selectedType)
      .then((res) => {
        const stepsData =
          res.data?.data?.steps ||
          (Array.isArray(res.data?.data) ? res.data.data : []);
        setSteps(Array.isArray(stepsData) ? stepsData : []);
      })
      .catch(() => setSteps([]))
      .finally(() => setStepsLoading(false));
  }, [selectedType]);

  const handleStepChange = (index, field, value) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const addStep = () => {
    const usedOfficeIds = new Set(steps.map((s) => Number(s.clearance_office_id)));
    const availableOffice = offices.find((o) => !usedOfficeIds.has(Number(o.id)));
    const defaultOfficeId = availableOffice ? availableOffice.id : (offices[0]?.id || "");

    setSteps((prev) => [
      ...prev,
      {
        clearance_office_id: defaultOfficeId,
        step_order: prev.length + 1,
        is_required: true,
        is_active: true,
      },
    ]);
  };

  const removeStep = (index) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStep = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((s, i) => (s.step_order = i + 1));
    setSteps(updated);
  };

  const handleSave = async () => {
    if (steps.length === 0) {
      setMessage("Workflow must contain at least one step.");
      return;
    }

    const officeIds = steps.map((s) => Number(s.clearance_office_id));
    if (new Set(officeIds).size !== officeIds.length) {
      setMessage("Each clearance office can only appear once in the workflow. Please remove duplicate offices.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const res = await adminApi.saveWorkflow({
        student_type_id: Number(selectedType),
        steps: steps.map((s, i) => ({
          clearance_office_id: Number(s.clearance_office_id),
          step_order: i + 1,
          is_required: Boolean(s.is_required ?? true),
          is_active: Boolean(s.is_active ?? true),
        })),
      });
      const savedSteps =
        res.data?.data?.steps ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      if (savedSteps.length > 0) {
        setSteps(savedSteps);
      }
      setMessage("Workflow saved successfully.");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to save workflow.";
      setMessage(errorMsg);
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Reset workflow to default? This will restore the standard steps for this student type.",
      )
    )
      return;
    setSaving(true);
    setMessage("");
    try {
      const resetRes = await adminApi.resetWorkflow(selectedType);
      const resetSteps =
        resetRes.data?.data?.steps ||
        (Array.isArray(resetRes.data?.data) ? resetRes.data.data : []);
      if (resetSteps.length > 0) {
        setSteps(resetSteps);
      } else {
        const res = await adminApi.workflowByType(selectedType);
        const stepsData =
          res.data?.data?.steps ||
          (Array.isArray(res.data?.data) ? res.data.data : []);
        setSteps(Array.isArray(stepsData) ? stepsData : []);
      }
      setMessage("Workflow reset to default successfully.");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to reset workflow.";
      setMessage(errorMsg);
    }
    setSaving(false);
  };

  const selectedTypeName =
    studentTypes.find((t) => String(t.id) === String(selectedType))?.name || "Student Type";

  const duplicateOfficeIds = steps
    .map((s) => Number(s.clearance_office_id))
    .filter((id, index, arr) => arr.indexOf(id) !== index);
  const hasDuplicates = duplicateOfficeIds.length > 0;

  if (loading && studentTypes.length === 0) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Workflow Configuration
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define clearance steps and approval sequences for each student type
          </p>
        </div>
      </div>

      {/* Student Type Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Student Type
        </label>
        <div className="flex flex-wrap gap-2">
          {studentTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                String(selectedType) === String(t.id)
                  ? "bg-gradient-to-r from-mwu-blue to-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
            message.includes("success") || message.includes("default")
              ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
              : "bg-red-50 border border-red-100 text-red-700"
          }`}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {message.includes("success") || message.includes("default") ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01"
              />
            )}
          </svg>
          {message}
        </div>
      )}

      {/* Duplicate Offices Warning */}
      {hasDuplicates && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>
            Duplicate office detected. Each clearance office can only appear once in the workflow. Please adjust before saving.
          </span>
        </div>
      )}

      {/* Workflow Steps */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Workflow Steps for {selectedTypeName}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {steps.length} step{steps.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          <button
            onClick={addStep}
            disabled={steps.length >= offices.length && offices.length > 0}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-mwu-blue to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Step
          </button>
        </div>

        {stepsLoading ? (
          <div className="py-12 flex justify-center items-center">
            <LoadingSpinner />
          </div>
        ) : steps.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              No workflow steps configured for {selectedTypeName}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Click "Add Step" or "Reset to Default" to configure the clearance sequence
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isDuplicate = steps.some(
                (s, i) =>
                  i !== index &&
                  Number(s.clearance_office_id) === Number(step.clearance_office_id),
              );

              return (
                <div
                  key={step.id ? `step-${step.id}` : `new-${index}`}
                  className={`flex items-center gap-3 p-4 bg-gray-50/80 border rounded-xl group transition-all ${
                    isDuplicate
                      ? "border-red-300 bg-red-50/30"
                      : "border-gray-100 hover:border-mwu-blue/30"
                  }`}
                >
                  {/* Step number */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mwu-blue to-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>

                  {/* Office select */}
                  <div className="flex-1">
                    <select
                      value={step.clearance_office_id ? Number(step.clearance_office_id) : ""}
                      onChange={(e) =>
                        handleStepChange(
                          index,
                          "clearance_office_id",
                          Number(e.target.value),
                        )
                      }
                      className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none bg-white transition-all ${
                        isDuplicate ? "border-red-400 text-red-700" : "border-gray-200"
                      }`}
                    >
                      {offices.map((o) => {
                        const isUsedInOther = steps.some(
                          (s, i) =>
                            i !== index &&
                            Number(s.clearance_office_id) === Number(o.id),
                        );
                        return (
                          <option
                            key={o.id}
                            value={o.id}
                            className={isUsedInOther ? "text-gray-400" : ""}
                          >
                            {o.name} {isUsedInOther ? " (already in workflow)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Toggles */}
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={step.is_required ?? true}
                      onChange={(e) =>
                        handleStepChange(index, "is_required", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-mwu-blue focus:ring-mwu-blue"
                    />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={step.is_active ?? true}
                      onChange={(e) =>
                        handleStepChange(index, "is_active", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-mwu-blue focus:ring-mwu-blue"
                    />
                    Active
                  </label>

                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveStep(index, -1)}
                      disabled={index === 0}
                      title="Move up"
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-all"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(index, 1)}
                      disabled={index === steps.length - 1}
                      title="Move down"
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-all"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    title="Remove step"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving || stepsLoading || hasDuplicates}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-mwu-blue to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Save Workflow"
            )}
          </button>
          <button
            onClick={handleReset}
            disabled={saving || stepsLoading}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}

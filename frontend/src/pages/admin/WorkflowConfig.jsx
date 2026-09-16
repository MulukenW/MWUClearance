import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function WorkflowConfig() {
  const [studentTypes, setStudentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [steps, setSteps] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.studentTypes().catch(() => ({ data: { data: [] } })),
      adminApi.clearanceOffices().catch(() => ({ data: { data: [] } })),
    ])
      .then(([typesRes, officesRes]) => {
        const types = typesRes.data.data?.data || typesRes.data.data || [];
        const officeList =
          officesRes.data.data?.data || officesRes.data.data || [];
        setStudentTypes(types);
        setOffices(officeList);
        if (types.length > 0) setSelectedType(types[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedType) return;
    setLoading(true);
    adminApi
      .workflowByType(selectedType)
      .then((res) => {
        const data = res.data.data?.data || res.data.data || [];
        setSteps(Array.isArray(data) ? data : []);
      })
      .catch(() => setSteps([]))
      .finally(() => setLoading(false));
  }, [selectedType]);

  const handleStepChange = (index, field, value) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        clearance_office_id: offices[0]?.id || "",
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
    setSaving(true);
    setMessage("");
    try {
      await adminApi.saveWorkflow({
        student_type_id: selectedType,
        steps: steps.map((s, i) => ({
          clearance_office_id: s.clearance_office_id,
          step_order: i + 1,
          is_required: s.is_required ?? true,
          is_active: s.is_active ?? true,
        })),
      });
      setMessage("Workflow saved successfully.");
    } catch {
      setMessage("Failed to save workflow.");
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Reset workflow to default? This will remove custom steps.",
      )
    )
      return;
    setSaving(true);
    try {
      await adminApi.resetWorkflow(selectedType);
      const res = await adminApi.workflowByType(selectedType);
      setSteps(res.data.data?.data || res.data.data || []);
      setMessage("Workflow reset to default.");
    } catch {
      setMessage("Failed to reset workflow.");
    }
    setSaving(false);
  };

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
            Define clearance steps for each student type
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
          className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${message.includes("success") || message.includes("default") ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-red-50 border border-red-100 text-red-700"}`}
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

      {/* Workflow Steps */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Workflow Steps</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {steps.length} step{steps.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          <button
            onClick={addStep}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-mwu-blue to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 transition-all shadow-sm"
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

        {steps.length === 0 ? (
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
              No workflow steps configured
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Click "Add Step" to create the first step
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-gray-50/80 border border-gray-100 rounded-xl group hover:border-mwu-blue/30 transition-all"
              >
                {/* Step number */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mwu-blue to-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>

                {/* Office select */}
                <div className="flex-1">
                  <select
                    value={step.clearance_office_id || ""}
                    onChange={(e) =>
                      handleStepChange(
                        index,
                        "clearance_office_id",
                        e.target.value,
                      )
                    }
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none bg-white transition-all"
                  >
                    {offices.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toggles */}
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
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
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
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
                    onClick={() => moveStep(index, -1)}
                    disabled={index === 0}
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
                    onClick={() => moveStep(index, 1)}
                    disabled={index === steps.length - 1}
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
                  onClick={() => removeStep(index)}
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
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-mwu-blue to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 disabled:opacity-50 transition-all shadow-sm"
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
            disabled={saving}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}

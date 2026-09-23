import { useState, useEffect, useRef } from "react";
import { settingsApi } from "../../services/api";
import { applyBrandColor } from "../../utils/branding";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef(null);
  const stampInput = useRef(null);

  const [form, setForm] = useState({
    university_name: "",
    system_name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  });
  const [logoUrl, setLogoUrl] = useState(null);
  const [stampUrl, setStampUrl] = useState(null);
  const [savedColor, setSavedColor] = useState("");
  const [colorDraft, setColorDraft] = useState("#042791");

  const fetchSettings = () => {
    setLoading(true);
    settingsApi
      .list()
      .then((res) => {
        const data = res.data.data || [];
        setSettings(data);
        const map = {};
        data.forEach((s) => {
          map[s.key] = s.value || "";
          if (s.key === "logo_path" && s.url) setLogoUrl(s.url);
          if (s.key === "stamp_path" && s.url) setStampUrl(s.url);
          if (s.key === "primary_color") {
            const color = s.value || "#042791";
            setSavedColor(color);
            setColorDraft(color);
          }
        });
        setForm({
          university_name: map.university_name || "",
          system_name: map.system_name || "",
          address: map.address || "",
          phone: map.phone || "",
          email: map.email || "",
          website: map.website || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveGeneral = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await settingsApi.update(form);
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings.");
    }
    setSaving(false);
  };

  const COLOR_PRESETS = [
    { name: "MWU Blue", value: "#042791" },
    { name: "Emerald", value: "#047857" },
    { name: "Maroon", value: "#8b1e3f" },
    { name: "Royal Purple", value: "#5b21b6" },
    { name: "Teal", value: "#0f766e" },
    { name: "Slate", value: "#334155" },
  ];

  const handleColorChange = (value) => {
    setColorDraft(value);
    // Live preview — restyle the whole app immediately
    if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value)) {
      applyBrandColor(value);
    }
  };

  const handleColorSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await settingsApi.update({ primary_color: colorDraft.trim() });
      setSavedColor(colorDraft.trim().toLowerCase());
      applyBrandColor(colorDraft.trim());
      setMessage("Brand color saved. It now applies to everyone.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save brand color.");
    }
    setSaving(false);
  };

  const handleColorReset = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await settingsApi.update({ primary_color: "" });
      setSavedColor("");
      setColorDraft("#042791");
      applyBrandColor("#042791");
      setMessage("Brand color reset to the MWU blue default.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset brand color.");
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await settingsApi.uploadLogo(formData);
      setLogoUrl(res.data.data?.url || null);
      setMessage("Logo uploaded successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload logo.");
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleDeleteLogo = async () => {
    setMessage("");
    setError("");
    try {
      await settingsApi.deleteLogo();
      setLogoUrl(null);
      setMessage("Logo removed. Default logo will be used.");
    } catch {
      setError("Failed to remove logo.");
    }
  };

  const handleStampUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("stamp", file);
      const res = await settingsApi.uploadStamp(formData);
      setStampUrl(res.data.data?.url || null);
      setMessage("Stamp uploaded successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload stamp.");
    }
    setUploading(false);
    if (stampInput.current) stampInput.current.value = "";
  };

  const handleDeleteStamp = async () => {
    setMessage("");
    setError("");
    try {
      await settingsApi.deleteStamp();
      setStampUrl(null);
      setMessage("Stamp removed from new certificates.");
    } catch {
      setError("Failed to remove stamp.");
    }
  };

  if (loading) return <LoadingSpinner />;

  const logoPreview = logoUrl || "/mwu-logo.png";
  const inputClass =
    "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none transition-all bg-gray-50 focus:bg-white";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white shadow-sm">
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">System Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure university and system information
          </p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
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
              d="M12 9v2m0 4h.01"
            />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Color */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Brand Color</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Primary color used across the whole system — buttons, sidebar,
              headers, and highlights
            </p>
          </div>
          <div className="p-6">
            {/* Live preview strip */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden mb-5">
              <div
                className="h-14 flex items-center px-4 text-white text-sm font-semibold"
                style={{
                  background: `linear-gradient(to right, ${colorDraft}, ${
                    /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(colorDraft)
                      ? colorDraft
                      : "#042791"
                  })`,
                }}
              >
                Sidebar & Headers preview
              </div>
              <div className="bg-white p-3 flex items-center gap-2">
                <span
                  className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
                  style={{ backgroundColor: colorDraft }}
                >
                  Button
                </span>
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    color: colorDraft,
                    backgroundColor: `${colorDraft}1a`,
                  }}
                >
                  Highlight text
                </span>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Primary color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={
                  /^#([0-9a-fA-F]{6})$/.test(colorDraft)
                    ? colorDraft
                    : "#042791"
                }
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-12 h-11 rounded-xl border border-gray-200 cursor-pointer bg-white p-1"
                title="Pick a color"
              />
              <input
                type="text"
                value={colorDraft}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#042791"
                className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none transition-all bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Quick picks</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handleColorChange(p.value)}
                    title={p.name}
                    className={`w-9 h-9 rounded-xl border-2 transition-all ${
                      colorDraft.toLowerCase() === p.value
                        ? "border-gray-800 scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: p.value }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400">
                {savedColor
                  ? `Current: ${savedColor}`
                  : "Using the MWU blue default"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleColorReset}
                  disabled={saving}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Reset Default
                </button>
                <button
                  onClick={handleColorSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all shadow-sm"
                  style={{ backgroundColor: colorDraft }}
                >
                  {saving ? "Saving..." : "Save Color"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logo Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">University Logo</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Appears on login page, sidebar, certificates, and verification
            </p>
          </div>
          <div className="p-6">
            {/* Preview */}
            <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 p-8 mb-5">
              <img
                src={logoPreview}
                alt="University Logo"
                className="w-32 h-32 object-contain"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                  uploading
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-mwu-blue to-blue-600 text-white hover:from-mwu-blue-dark hover:to-blue-700 shadow-sm"
                }`}
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                {uploading ? "Uploading..." : "Upload New Logo"}
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {logoUrl && (
                <button
                  onClick={handleDeleteLogo}
                  className="inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
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
                  Remove Custom Logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stamp Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Certificate Stamp</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Appears on newly generated certificates
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 p-8 mb-5 min-h-[208px]">
              {stampUrl ? (
                <img src={stampUrl} alt="Certificate stamp" className="w-36 h-36 object-contain" />
              ) : (
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-mwu-blue/40 flex items-center justify-center text-center text-xs font-semibold text-mwu-blue px-6">
                  No stamp uploaded
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <label className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${uploading ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-mwu-blue to-blue-600 text-white hover:from-mwu-blue-dark hover:to-blue-700 shadow-sm"}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {uploading ? "Uploading..." : "Upload Certificate Stamp"}
                <input ref={stampInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleStampUpload} className="hidden" disabled={uploading} />
              </label>
              {stampUrl && (
                <button onClick={handleDeleteStamp} className="inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
                  Remove Certificate Stamp
                </button>
              )}
            </div>
          </div>
        </div>

        {/* General Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">
              General Information
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              These details appear on certificates and public pages
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  University Name
                </label>
                <input
                  type="text"
                  value={form.university_name}
                  onChange={(e) =>
                    setForm({ ...form, university_name: e.target.value })
                  }
                  placeholder="Madda Walabu University"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  System Name
                </label>
                <input
                  type="text"
                  value={form.system_name}
                  onChange={(e) =>
                    setForm({ ...form, system_name: e.target.value })
                  }
                  placeholder="Student Clearance Management System"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="University address"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="+251-..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="info@mwu.edu.et"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Website
                </label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                  placeholder="https://www.mwu.edu.et"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSaveGeneral}
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
                  "Save Settings"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

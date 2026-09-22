import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentClearanceApi, authApi } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function NewClearance() {
  const [formData, setFormData] = useState({
    purpose: "",
    reason_for_clearance: "",
    reason_other: "",
    police_location: "",
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch student info and check for existing clearance in current academic year
    authApi
      .me()
      .then((res) => {
        const student = res.data.data?.student;
        if (student) {
          const info = {
            academic_year: student.academic_year,
            admission_year: student.admission_year,
            department: student.department?.name,
            college: student.college?.name,
            program: student.program?.name,
            program_id: student.program_id,
            student_type: student.student_type?.name,
            student_type_id: student.student_type_id,
            student_id: student.student_id,
            name: student.full_name || [student.first_name, student.middle_name, student.last_name]
              .filter(Boolean)
              .join(" "),
          };
          setStudentInfo(info);

          // Check if student already has a clearance request in this academic year
          studentClearanceApi
            .list()
            .then((listRes) => {
              const requests = listRes.data.data || [];
              const existing = requests.find(
                (r) => r.academic_year === student.academic_year,
              );
              if (existing) {
                setAlreadyRequested(true);
                setExistingRequest(existing);
              }
            })
            .catch(() => {})
            .finally(() => setPageLoading(false));
        } else {
          setPageLoading(false);
        }
      })
      .catch(() => setPageLoading(false));
  }, []);

  const reasons = [
    { value: "end_of_semester", label: "End of Semester / Academic Year", icon: "📚" },
    { value: "withdrawal", label: "Withdrawal", icon: "🚪" },
    { value: "academic_dismissal", label: "Academic Dismissal", icon: "⚠️" },
    { value: "graduation", label: "Graduation", icon: "🎓" },
    { value: "other", label: "Other (Please Specify)", icon: "✏️" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.reason_for_clearance) {
      setError("Please select reason for clearance.");
      setLoading(false);
      return;
    }
    if (formData.reason_for_clearance === "other" && !formData.reason_other) {
      setError("Please specify the reason for clearance.");
      setLoading(false);
      return;
    }
    if (!formData.police_location) {
      setError("Please select police location (Robe, Goba, or Shashemene).");
      setLoading(false);
      return;
    }

    try {
      const res = await studentClearanceApi.create(formData);
      navigate(`/student/clearance/${res.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create clearance.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/student/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-mwu-blue mb-3 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-800">New Clearance Request</h1>
        <p className="text-gray-600 mt-1">Submit your clearance request for academic year {studentInfo?.academic_year} E.C.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Student Profile Card */}
          {studentInfo && (
            <div className="bg-gradient-to-br from-mwu-blue to-blue-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
                  {studentInfo.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{studentInfo.name}</h3>
                  <p className="text-sm text-white/80">{studentInfo.student_id}</p>
                </div>
              </div>
              
              <div className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-white/70 text-xs">College</div>
                    <div className="font-medium">{studentInfo.college}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-white/70 text-xs">Department</div>
                    <div className="font-medium">{studentInfo.department}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-white/70 text-xs">Program (Auto-fetched)</div>
                    <div className="font-medium">{studentInfo.program}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-white/70 text-xs">Student Type</div>
                    <div className="font-medium capitalize">{studentInfo.student_type}</div>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-white/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">Academic Year</span>
                    <span className="font-bold">{studentInfo.academic_year} E.C.</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-white/70">Admission Year</span>
                    <span className="font-bold">{studentInfo.admission_year} E.C.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 text-sm mb-1">Important Information</h3>
                <ul className="text-xs text-blue-800 space-y-1.5">
                  <li className="flex items-start gap-1">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Your <strong>Program</strong> is automatically fetched from your profile</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Only <strong>one clearance</strong> request per academic year</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Workflow steps vary by student type</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2">
          {/* Already requested warning */}
          {alreadyRequested && existingRequest && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 text-2xl">
                  ⚠️
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 text-lg mb-2">
                    Clearance Already Requested
                  </h3>
                  <p className="text-sm text-amber-800 mb-4">
                    You have already submitted a clearance request for academic year{" "}
                    <strong>{studentInfo?.academic_year}</strong>. Only one clearance request is allowed per semester.
                  </p>
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Request #:</span>
                        <div className="font-mono font-bold text-amber-700">{existingRequest.clearance_number}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <div className="font-semibold capitalize text-gray-800">{existingRequest.status}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Submitted:</span>
                        <div className="font-medium text-gray-800">
                          {existingRequest.submitted_at
                            ? new Date(existingRequest.submitted_at).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/student/clearance/${existingRequest.id}`)}
                    className="bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 transition-all shadow-sm"
                  >
                    View Existing Request →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={`space-y-6 ${alreadyRequested ? "opacity-40 pointer-events-none" : ""}`}
            >
              {/* Reason for Clearance */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Reason for Clearance <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {reasons.map((reason) => (
                    <label
                      key={reason.value}
                      className={`relative flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-mwu-blue hover:bg-blue-50 ${
                        formData.reason_for_clearance === reason.value
                          ? "border-mwu-blue bg-blue-50 shadow-sm"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason_for_clearance"
                        value={reason.value}
                        checked={formData.reason_for_clearance === reason.value}
                        onChange={handleChange}
                        className="w-5 h-5 text-mwu-blue focus:ring-2 focus:ring-mwu-blue"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{reason.icon}</span>
                        <span className="font-medium text-gray-800">{reason.label}</span>
                      </div>
                      {formData.reason_for_clearance === reason.value && (
                        <svg className="w-6 h-6 text-mwu-blue" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Other Reason (conditional) */}
              {formData.reason_for_clearance === "other" && (
                <div className="pl-6 border-l-4 border-mwu-blue">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please Specify Your Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="reason_other"
                    value={formData.reason_other}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none transition-all"
                    placeholder="Describe your reason..."
                  />
                </div>
              )}

              {/* Police Location */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  University Police Location <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label
                    className={`relative flex flex-col items-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-mwu-blue hover:bg-blue-50 ${
                      formData.police_location === "robe"
                        ? "border-mwu-blue bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="police_location"
                      value="robe"
                      checked={formData.police_location === "robe"}
                      onChange={handleChange}
                      className="absolute top-3 right-3 w-5 h-5 text-mwu-blue focus:ring-2 focus:ring-mwu-blue"
                    />
                    <div className="text-4xl">🏛️</div>
                    <div className="text-center">
                      <div className="font-bold text-gray-800">Robe Campus</div>
                      <div className="text-xs text-gray-500 mt-1">Main Campus Police</div>
                    </div>
                  </label>

                  <label
                    className={`relative flex flex-col items-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-mwu-blue hover:bg-blue-50 ${
                      formData.police_location === "goba"
                        ? "border-mwu-blue bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="police_location"
                      value="goba"
                      checked={formData.police_location === "goba"}
                      onChange={handleChange}
                      className="absolute top-3 right-3 w-5 h-5 text-mwu-blue focus:ring-2 focus:ring-mwu-blue"
                    />
                    <div className="text-4xl">🏢</div>
                    <div className="text-center">
                      <div className="font-bold text-gray-800">Goba Campus</div>
                      <div className="text-xs text-gray-500 mt-1">Branch Campus Police</div>
                    </div>
                  </label>

                  <label
                    className={`relative flex flex-col items-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-mwu-blue hover:bg-blue-50 ${
                      formData.police_location === "shashemene"
                        ? "border-mwu-blue bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="police_location"
                      value="shashemene"
                      checked={formData.police_location === "shashemene"}
                      onChange={handleChange}
                      className="absolute top-3 right-3 w-5 h-5 text-mwu-blue focus:ring-2 focus:ring-mwu-blue"
                    />
                    <div className="text-4xl">🏫</div>
                    <div className="text-center">
                      <div className="font-bold text-gray-800">Shashemene Campus</div>
                      <div className="text-xs text-gray-500 mt-1">Branch Campus Police</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-mwu-blue to-blue-600 text-white px-6 py-3.5 rounded-xl font-bold hover:from-mwu-blue-dark hover:to-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-mwu-blue/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Request...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit Clearance Request
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/student/dashboard")}
                  className="px-6 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

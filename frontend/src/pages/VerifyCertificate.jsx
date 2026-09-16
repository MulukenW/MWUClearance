import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL, verificationApi } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function VerifyCertificate() {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) {
      setError("No verification code provided.");
      setLoading(false);
      return;
    }
    verificationApi
      .verify(code)
      .then((res) => setResult(res.data.data || res.data))
      .catch((err) => {
        setError(err.response?.data?.message || "Verification failed.");
      })
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <LoadingSpinner />;

  const student = result?.student;
  const clearance = result?.clearance;
  const workflow = result?.workflow || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src={`${API_BASE_URL}/logo`}
            alt="MWU Logo"
            className="w-16 h-16 mx-auto mb-3"
          />
          <h1 className="text-2xl font-bold text-blue-900">
            Madda Walabu University
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Student Clearance Certificate Verification
          </p>
        </div>

        {/* Error / Invalid */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-3xl font-bold">&#10007;</span>
            </div>
            <h2 className="text-xl font-bold text-red-700 mb-2">
              Invalid Certificate
            </h2>
            <p className="text-sm text-red-600">{error}</p>
            <p className="text-xs text-gray-500 mt-4">
              Verification Code: {code}
            </p>
          </div>
        )}

        {/* Valid / Verified */}
        {result && !error && (
          <div>
            {/* Verification Status */}
            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-3xl font-bold">
                  &#10003;
                </span>
              </div>
              <h2 className="text-xl font-bold text-green-700 mb-2">
                Certificate Verified
              </h2>
              <p className="text-sm text-green-600">
                This certificate is authentic and was officially issued by Madda
                Walabu University.
              </p>
              <div className="mt-3 inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-bold">
                Status: {result.status}
              </div>
            </div>

            {/* Certificate Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Certificate No:</span>
                  <span className="font-medium ml-1">
                    {result.certificate_number}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Issue Date:</span>
                  <span className="font-medium ml-1">{result.issued_date}</span>
                </div>
                <div>
                  <span className="text-gray-500">Clearance No:</span>
                  <span className="font-medium ml-1">
                    {clearance?.clearance_number}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Issued By:</span>
                  <span className="font-medium ml-1">{result.issued_by}</span>
                </div>
              </div>
            </div>

            {/* Student Info */}
            {student && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 border-b pb-2 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs">
                    &#9432;
                  </span>
                  Student Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Full Name</span>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Student ID</span>
                    <span className="font-medium">{student.student_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">College</span>
                    <span className="font-medium">{student.college}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Department</span>
                    <span className="font-medium">{student.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Program</span>
                    <span className="font-medium">{student.program}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Student Type</span>
                    <span className="font-medium">{student.student_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Academic Year</span>
                    <span className="font-medium">{student.academic_year}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Workflow / Approval Summary */}
            {workflow.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 border-b pb-2 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs">
                    &#10003;
                  </span>
                  Clearance Approval Status
                </h3>
                <div className="space-y-1">
                  {workflow.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-gray-50"
                    >
                      <span className="text-gray-700 font-medium">
                        {step.office}
                      </span>
                      <span className="text-gray-600 text-xs flex-1 px-3">
                        {step.name || "N/A"}
                      </span>
                      <div className="flex items-center gap-2">
                        {step.status === "approved" && (
                          <span
                            className="text-green-600 text-lg"
                            title="Approved"
                          >
                            &#10004;
                          </span>
                        )}
                        {step.status === "not_required" && (
                          <span
                            className="text-gray-400 text-lg"
                            title="Not Required"
                          >
                            &#8212;
                          </span>
                        )}
                        {step.status === "rejected" && (
                          <span
                            className="text-red-600 text-lg"
                            title="Rejected"
                          >
                            &#10008;
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            step.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : step.status === "not_required"
                                ? "bg-gray-100 text-gray-500"
                                : step.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {step.status === "approved"
                            ? "APPROVED"
                            : step.status === "not_required"
                              ? "NOT REQUIRED"
                              : step.status === "rejected"
                                ? "REJECTED"
                                : step.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary count */}
                <div className="mt-3 pt-3 border-t flex justify-between text-xs text-gray-500">
                  <span>Total Steps: {workflow.length}</span>
                  <span className="text-green-600 font-medium">
                    Approved:{" "}
                    {workflow.filter((s) => s.status === "approved").length}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center">
          <p className="text-xs text-gray-400">
            Madda Walabu University &mdash; Student Clearance Management System
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Verification Code:{" "}
            <span className="font-mono font-bold">{code}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

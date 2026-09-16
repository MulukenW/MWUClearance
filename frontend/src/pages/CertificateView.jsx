import { useState, useEffect } from "react";
import { certificatesApi } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CertificateView() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    certificatesApi
      .list()
      .then((res) =>
        setCertificates(res.data.data?.data || res.data.data || []),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleView = async (cert) => {
    setSelected(cert);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Certificates</h1>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-4">📜</p>
          <p className="text-gray-500">No certificates available yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Certificates appear here once your clearance is completed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {cert.clearance?.clearance_number}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Issued:{" "}
                    {cert.issued_at
                      ? new Date(cert.issued_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {cert.status || "Valid"}
                </span>
              </div>

              <div className="flex gap-2">
                <a
                  href={`/api/certificate/${cert.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-mwu-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-mwu-blue-dark transition-colors"
                >
                  View & Print Certificate
                </a>
              </div>

              {cert.verification_code && (
                <p className="text-xs text-gray-400 mt-3">
                  Verification:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    {cert.verification_code}
                  </code>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certificate detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Certificate Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Certificate ID</span>
                <span className="font-medium">{selected.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Clearance</span>
                <span className="font-medium">
                  {selected.clearance?.clearance_number}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Verification Code</span>
                <span className="font-mono text-xs">
                  {selected.verification_code}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Verify URL</span>
                <a
                  href={`/verify/${selected.verification_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mwu-blue hover:underline text-xs"
                >
                  /verify/{selected.verification_code}
                </a>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { studentClearanceApi, certificatesApi } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { formatDate } from "../../utils/helpers";

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentClearanceApi
      .myCertificates()
      .then((res) => setCertificates(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Certificates</h1>
      {certificates.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No certificates yet"
          message="Complete a clearance request to receive your certificate."
        />
      ) : (
        <div className="grid gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {cert.certificate_number}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Issued: {formatDate(cert.issued_date)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Verification: {cert.verification_code}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={certificatesApi.downloadUrl(cert.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-mwu-blue text-white px-4 py-2 rounded-lg text-sm hover:bg-mwu-blue-dark"
                  >
                    View & Print
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

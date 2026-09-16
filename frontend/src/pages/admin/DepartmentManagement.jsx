import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import CrudManagement from "./CrudManagement";

export default function DepartmentManagement() {
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    adminApi
      .colleges()
      .then((res) => {
        const data = res.data.data?.data || res.data.data || [];
        setColleges(data.map((c) => ({ value: c.id, label: c.name })));
      })
      .catch(() => {});
  }, []);

  const columns = [
    { key: "name", label: "Name" },
    { key: "code", label: "Code" },
    { key: "college.name", label: "College" },
    {
      key: "created_at",
      label: "Created",
      render: (item) =>
        item.created_at
          ? new Date(item.created_at).toLocaleDateString()
          : "N/A",
    },
  ];

  const formFields = [
    { name: "name", label: "Department Name", type: "text" },
    { name: "code", label: "Code", type: "text" },
    { name: "college_id", label: "College", type: "select", options: colleges },
    { name: "description", label: "Description", type: "textarea" },
  ];

  const emptyForm = { name: "", code: "", college_id: "", description: "" };

  return (
    <CrudManagement
      title="Departments"
      subtitle="Manage academic departments under each college"
      icon={
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
            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
          />
        </svg>
      }
      fetchFn={adminApi.departments}
      createFn={adminApi.createDepartment}
      updateFn={adminApi.updateDepartment}
      deleteFn={adminApi.deleteDepartment}
      toggleFn={adminApi.toggleDepartmentActive}
      columns={columns}
      formFields={formFields}
      emptyForm={emptyForm}
    />
  );
}

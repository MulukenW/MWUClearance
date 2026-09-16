import { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import CrudManagement from "./CrudManagement";

export default function ProgramManagement() {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    adminApi
      .departments()
      .then((res) => {
        const data = res.data.data?.data || res.data.data || [];
        setDepartments(data.map((d) => ({ value: d.id, label: d.name })));
      })
      .catch(() => {});
  }, []);

  const columns = [
    { key: "name", label: "Name" },
    { key: "code", label: "Code" },
    { key: "level", label: "Level" },
    { key: "department.name", label: "Department" },
    { key: "duration_years", label: "Duration (yrs)" },
  ];

  const formFields = [
    { name: "name", label: "Program Name", type: "text" },
    { name: "code", label: "Code", type: "text" },
    {
      name: "level",
      label: "Level",
      type: "select",
      options: [
        { value: "undergraduate", label: "Undergraduate" },
        { value: "graduate", label: "Graduate" },
        { value: "postgraduate", label: "Postgraduate" },
        { value: "diploma", label: "Diploma" },
        { value: "certificate", label: "Certificate" },
      ],
    },
    {
      name: "department_id",
      label: "Department",
      type: "select",
      options: departments,
    },
    { name: "duration_years", label: "Duration (years)", type: "number" },
  ];

  const emptyForm = {
    name: "",
    code: "",
    level: "",
    department_id: "",
    duration_years: 4,
  };

  return (
    <CrudManagement
      title="Programs"
      subtitle="Manage academic programs offered by departments"
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
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      }
      fetchFn={adminApi.programs}
      createFn={adminApi.createProgram}
      updateFn={adminApi.updateProgram}
      deleteFn={adminApi.deleteProgram}
      toggleFn={adminApi.toggleProgramActive}
      columns={columns}
      formFields={formFields}
      emptyForm={emptyForm}
    />
  );
}

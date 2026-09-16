import { adminApi } from "../../services/api";
import CrudManagement from "./CrudManagement";

const columns = [
  { key: "name", label: "Name" },
  { key: "code", label: "Code" },
  { key: "description", label: "Description" },
];

const formFields = [
  { name: "name", label: "Type Name", type: "text" },
  { name: "code", label: "Code", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
];

const emptyForm = { name: "", code: "", description: "" };

export default function StudentTypeManagement() {
  return (
    <CrudManagement
      title="Student Types"
      subtitle="Define categories of students (e.g., Regular, Extension, Summer)"
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
            d="M7 7h.01M7 14h.01M14 7h.01M14 14h.01M21 7h.01M21 14h.01M7 21h.01M14 21h.01M21 21h.01M3 3h18v18H3V3z"
          />
        </svg>
      }
      fetchFn={adminApi.studentTypes}
      createFn={adminApi.createStudentType}
      updateFn={adminApi.updateStudentType}
      deleteFn={adminApi.deleteStudentType}
      toggleFn={adminApi.toggleStudentTypeActive}
      columns={columns}
      formFields={formFields}
      emptyForm={emptyForm}
    />
  );
}

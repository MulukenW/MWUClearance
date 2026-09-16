import { adminApi } from "../../services/api";
import CrudManagement from "./CrudManagement";

const columns = [
  { key: "name", label: "Name" },
  { key: "code", label: "Code" },
  {
    key: "created_at",
    label: "Created",
    render: (item) =>
      item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A",
  },
];

const formFields = [
  { name: "name", label: "College Name", type: "text" },
  { name: "code", label: "Code", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
];

const emptyForm = { name: "", code: "", description: "" };

export default function CollegeManagement() {
  return (
    <CrudManagement
      title="Colleges"
      subtitle="Manage academic colleges within the university"
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
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      }
      fetchFn={adminApi.colleges}
      createFn={adminApi.createCollege}
      updateFn={adminApi.updateCollege}
      deleteFn={adminApi.deleteCollege}
      toggleFn={adminApi.toggleCollegeActive}
      columns={columns}
      formFields={formFields}
      emptyForm={emptyForm}
    />
  );
}

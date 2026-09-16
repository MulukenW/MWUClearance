import { adminApi } from "../../services/api";
import CrudManagement from "./CrudManagement";

const columns = [
  { key: "name", label: "Office Name" },
  { key: "code", label: "Code" },
  { key: "description", label: "Description" },
];

const formFields = [
  { name: "name", label: "Office Name", type: "text" },
  { name: "code", label: "Code", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
];

const emptyForm = { name: "", code: "", description: "" };

export default function OfficeManagement() {
  return (
    <CrudManagement
      title="Clearance Offices"
      subtitle="Manage offices involved in the clearance workflow"
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
      fetchFn={adminApi.clearanceOffices}
      createFn={adminApi.createClearanceOffice}
      updateFn={adminApi.updateClearanceOffice}
      deleteFn={adminApi.deleteClearanceOffice}
      toggleFn={adminApi.toggleClearanceOfficeActive}
      columns={columns}
      formFields={formFields}
      emptyForm={emptyForm}
    />
  );
}

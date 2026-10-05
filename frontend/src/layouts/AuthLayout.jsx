import { Outlet } from "react-router-dom";
import { useBrandInfo } from "../utils/branding";

export default function AuthLayout() {
  const { system_name, university_name } = useBrandInfo();

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-mwu-blue to-mwu-blue-dark flex items-center justify-center px-4 py-8 sm:p-6">
      <div className="w-full max-w-sm min-w-0">
        <div className="text-center mb-6 sm:mb-8 space-y-1.5">
          <h1 className="mx-auto max-w-sm text-2xl sm:text-3xl font-bold leading-tight text-white break-words">
            {system_name}
          </h1>
          <h2 className="mx-auto max-w-sm text-2xl sm:text-3xl font-bold leading-tight text-white break-words">
            {university_name}
          </h2>
        </div>
        <div className="w-full rounded-xl bg-white p-6 shadow-2xl sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

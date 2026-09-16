import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-mwu-blue to-mwu-blue-dark flex items-center justify-center px-4 py-8 sm:p-6">
      <div className="w-full max-w-sm min-w-0">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="mx-auto max-w-xs text-2xl sm:text-3xl font-bold leading-tight text-white break-words">
            MWU Student Clearance System
          </h1>
          <p className="text-blue-200 mt-2">Madda Walabu University</p>
        </div>
        <div className="w-full rounded-xl bg-white p-6 shadow-2xl sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

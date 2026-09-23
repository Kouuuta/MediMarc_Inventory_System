import { Outlet } from "react-router-dom";
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";

function AppLayout() {
  return (
    <div className="bg-background flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileSidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
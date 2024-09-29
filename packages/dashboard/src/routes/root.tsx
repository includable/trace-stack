import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Menu } from "@/components/layout/menu";
import { cn } from "@/lib/utils";

export default function Root() {
  const location = useLocation();
  const isInvocationPage = location.pathname.includes("invocations/");

  return (
    <div className={cn("flex flex-col", isInvocationPage && "md:h-screen")}>
      <Menu />
      {isInvocationPage ? (
        <Suspense fallback={<div>Loading...</div>}>
          <Outlet />
        </Suspense>
      ) : (
        <div className="p-8 pt-6">
          <Suspense fallback={<div>Loading...</div>}>
            <Outlet />
          </Suspense>
        </div>
      )}
    </div>
  );
}

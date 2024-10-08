import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import "@xyflow/react/dist/style.css";
import "./index.css";

import Root from "@/routes/root";
import Functions from "@/routes/functions/page";
import Invocations from "@/routes/invocations/page";
import InvocationDetails from "@/routes/invocation-details/page";
import Errors from "@/routes/errors/page";
import Users from "@/routes/users/page";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { DateRangeProvider } from "@/components/layout/date-picker";
import { PrivateRoutes } from "@/components/auth/private-routes";
import { Toaster } from "@/components/ui/toaster";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/functions",
        element: <Functions />,
      },
      {
        path: "/errors",
        element: <Errors />,
      },
      {
        path: "/users",
        element: <Users />,
      },
      {
        path: "/functions/:region/:name/invocations",
        element: <Invocations />,
      },
      {
        path: "/functions/:region/:name/invocations/:ts/:id",
        element: <InvocationDetails />,
      },
      {
        path: "/",
        element: <Navigate to="/functions" replace />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <ThemeProvider defaultTheme="dark" storageKey="trace-stack-ui-theme">
    <DateRangeProvider>
      <PrivateRoutes>
        <RouterProvider router={router} />
      </PrivateRoutes>
    </DateRangeProvider>
    <Toaster />
  </ThemeProvider>,
);

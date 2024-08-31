import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import "./index.css";

import Root from "@/routes/root";
import Functions from "@/routes/functions/page";
import Invocations from "@/routes/invocations/page";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { dataLoader } from "@/lib/api";
import { DateRangeProvider } from "@/components/layout/date-picker";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/functions",
        element: <Functions />,
        loader: dataLoader("functions"),
      },
      {
        path: '/functions/:region/:name/invocations',
        element: <Invocations />,
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
      <RouterProvider router={router} />
    </DateRangeProvider>
  </ThemeProvider>,
);

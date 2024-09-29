import { Login } from "@/components/auth/login";
import { getToken } from "@/lib/auth";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

const loginRouter = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    children: [
      {
        path: "/*?",
        element: <Login />,
      },
    ],
  },
]);

export const PrivateRoutes = ({ children }) => {
  if (getToken()) {
    return children;
  }

  return <RouterProvider router={loginRouter} />;
};

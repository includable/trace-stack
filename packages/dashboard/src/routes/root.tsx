import DatePicker from "@/components/layout/date-picker";
import { MenuLink } from "@/components/layout/menu-link";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { Suspense } from "react";
import { Link, Outlet } from "react-router-dom";

export default function Root() {
  return (
    <>
      <div className="flex-col md:flex">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <nav className="flex items-center space-x-4 lg:space-x-6">
              <Link to="/">
                <svg
                  className="size-6 mr-2 ml-1"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g
                    stroke="none"
                    strokeWidth="1"
                    fill="none"
                    fillRule="evenodd"
                  >
                    <g stroke="currentColor" strokeWidth="5">
                      <polyline
                        id="Path"
                        points="8.57 37.77 24 24 39.72 37.77"
                      />
                      <circle id="Oval" cx="24" cy="24" r="21" />
                    </g>
                  </g>
                </svg>
              </Link>

              <MenuLink
                to="/functions"
              >
                Functions
              </MenuLink>
              <MenuLink
                to="/errors"
              >
                Errors
              </MenuLink>
              <Link
                to="/integrations"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Integrations
              </Link>
              {/* <Link
                to="/traces"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Traces
              </Link>
              <Link
                to="/users"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Users
              </Link>
              <Link
                to="/settings"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Settings
              </Link> */}
            </nav>
            <div className="ml-auto flex items-center space-x-4">
              <DatePicker />
              <ModeToggle />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <Suspense fallback={<div>Loading...</div>}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </>
  );
}

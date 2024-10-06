import { Link } from "react-router-dom";

import DatePicker from "@/components/layout/date-picker";
import { MenuLink } from "@/components/layout/menu-link";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { SearchMenu } from "@/components/layout/search-menu";

export const Menu = ({ guest = false }) => {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <Link to="/">
            <svg
              className="size-6 mr-2 ml-1"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g stroke="currentColor" strokeWidth="5">
                  <polyline id="Path" points="8.57 37.77 24 24 39.72 37.77" />
                  <circle id="Oval" cx="24" cy="24" r="21" />
                </g>
              </g>
            </svg>
          </Link>

          {!guest && (
            <>
              <MenuLink to="/functions">Functions</MenuLink>
              <MenuLink to="/errors">Errors</MenuLink>
              <MenuLink to="/users">Users</MenuLink>
            </>
          )}
        </nav>
        <div className="ml-auto flex items-center space-x-2">
          {!guest && <DatePicker />}
          {!guest && <SearchMenu />}
          {!guest ? <UserMenu /> : <ModeToggle />}
        </div>
      </div>
    </div>
  );
};

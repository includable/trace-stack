import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";

export const MenuLink = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          `text-sm font-medium transition-colors hover:text-primary`,
          !isActive && "text-muted-foreground",
        )
      }
    >
      {children}
    </NavLink>
  );
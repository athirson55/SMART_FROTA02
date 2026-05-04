import { NavLink } from "react-router-dom";
import { AppIcon } from "./AppIcon";

export function SidebarItem({
  to,
  label,
  icon,
  end = false,
  isCollapsed,
  onSelect,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onSelect}
      className={({ isActive }) =>
        [
          "fg-sidebar-item",
          isActive ? "is-active" : "",
          isCollapsed ? "is-collapsed" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      <span className="fg-sidebar-item__icon">
        <AppIcon type={icon} />
      </span>
      <span className="fg-sidebar-item__label">{label}</span>
    </NavLink>
  );
}

import { NavLink } from "react-router-dom";
import { AppIcon } from "./AppIcon";

export function SidebarItem({
  to,
  label,
  icon,
  end = false,
  isCollapsed,
  onSelect,
  badge,
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
      <span className="fg-sidebar-item__icon" style={{ position: "relative" }}>
        <AppIcon type={icon} />
        {badge ? (
          <span className="fg-sidebar-item__badge">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span className="fg-sidebar-item__label">{label}</span>
    </NavLink>
  );
}

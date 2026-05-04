import { Link, useLocation } from "react-router-dom";

const labelsByPath = {
  home: "Home",
  dashboard: "Dashboard",
  veiculos: "Veículos",
  motoristas: "Motoristas",
  manutencoes: "Manutenções",
  agendamentos: "Agendamentos",
  alertas: "Alertas",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
  pendencias: "Pendências",
};

export function PageBreadcrumb() {
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);

  if (pathParts.length === 0 || pathParts[0] === "login") {
    return null;
  }

  const normalizedParts =
    pathParts[0] === "home" ? pathParts.slice(1) : pathParts;

  const crumbs = normalizedParts.map((part, index) => {
    const sourceIndex = pathParts[0] === "home" ? index + 1 : index;
    const path = `/${pathParts.slice(0, sourceIndex + 1).join("/")}`;
    return {
      path,
      label: labelsByPath[part] ?? part,
      isLast: sourceIndex === pathParts.length - 1,
    };
  });

  return (
    <nav className="fg-page-breadcrumb" aria-label="Breadcrumb">
      <Link to="/home">Home</Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path}>
          <em>›</em>
          {crumb.isLast ? (
            <strong>{crumb.label}</strong>
          ) : (
            <Link to={crumb.path}>{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}

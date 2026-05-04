import "../styles/dashboard.css";
import { AppLayout } from "../components/AppLayout";
import { AppHeader } from "../components/AppHeader";

export function SimpleSectionPage({ title, children }) {
  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content">
        <div className="fg-home-section-head">
          <h3>{title}</h3>
        </div>
        {children}
      </div>
    </AppLayout>
  );
}

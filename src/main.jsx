import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { UiFeedbackProvider } from "./context/UiFeedbackContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import "./styles.css";

// Apply saved theme synchronously to avoid flash
const savedTheme = localStorage.getItem("smart-frota-theme");
if (savedTheme === "escuro") {
  document.documentElement.classList.add("dark");
}

// Apply saved accent color synchronously to avoid flash
const savedAccent = localStorage.getItem("smart-frota-accent");
if (savedAccent) {
  const r = parseInt(savedAccent.slice(1, 3), 16);
  const g = parseInt(savedAccent.slice(3, 5), 16);
  const b = parseInt(savedAccent.slice(5, 7), 16);
  const root = document.documentElement;
  root.style.setProperty("--sf-primary", savedAccent);
  root.style.setProperty("--sf-text-active", savedAccent);
  root.style.setProperty("--sf-primary-light", `rgba(${r},${g},${b},0.12)`);
  root.style.setProperty("--sf-bg-active", `rgba(${r},${g},${b},0.1)`);
}

function App() {
  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <PreferencesProvider>
        <AuthProvider>
          <UiFeedbackProvider>
            <App />
          </UiFeedbackProvider>
        </AuthProvider>
      </PreferencesProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

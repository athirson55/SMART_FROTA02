import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { UiFeedbackProvider } from "./context/UiFeedbackContext";
import "./styles.css";

function App() {
  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <UiFeedbackProvider>
        <App />
      </UiFeedbackProvider>
    </AuthProvider>
  </React.StrictMode>,
);

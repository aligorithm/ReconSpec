import React from "react";
import ReactDOM from "react-dom/client";
import { SpecProvider } from "./context/SpecContext.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import App from "./App.js";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SpecProvider>
        <App />
      </SpecProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

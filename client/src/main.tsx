import React from "react";
import ReactDOM from "react-dom/client";
import { SpecProvider } from "./context/SpecContext.js";
import App from "./App.js";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SpecProvider>
      <App />
    </SpecProvider>
  </React.StrictMode>
);

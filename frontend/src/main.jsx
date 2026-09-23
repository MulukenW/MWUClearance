import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/inter";
import "./index.css";
import { loadBrandColor } from "./utils/branding";

// Apply the admin-configured brand color before first paint of the app tree.
loadBrandColor();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import React from "react";
import ReactDOM from "react-dom/client";
import { Root } from "./root.js";
import "./styles.css";
import "./shell.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);

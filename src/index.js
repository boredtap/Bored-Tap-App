import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import BoostersContext from "./context/BoosterContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BoostersContext>
      <App />
    </BoostersContext>
  </React.StrictMode>
);

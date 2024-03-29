import "./index.css";

import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";
import { TransactionProvider } from "./context/TransactionContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <TransactionProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </TransactionProvider>
);

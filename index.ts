import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { TooltipProvider } from "./components/ui/tooltip";

const root = document.getElementById("root");
if (!root) {
  throw new Error("#root element not found");
}

createRoot(root).render(createElement(TooltipProvider, null, createElement(App)));

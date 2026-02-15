import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { App } from "./App";
import "./index.css";
import { TooltipProvider } from "./components/ui/tooltip";

createRoot(document.getElementById("root") as HTMLDivElement).render(createElement(TooltipProvider, null, createElement(App)));

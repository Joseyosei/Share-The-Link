import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

const rootElement = document.getElementById("root")!;
createRoot(rootElement).render(<App />);

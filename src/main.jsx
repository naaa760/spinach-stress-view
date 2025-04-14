import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
// Import Leaflet CSS at the entry point BEFORE your app CSS
import "leaflet/dist/leaflet.css";
import "./styles/map.css";
import "./styles/patterns.css";
import "./styles/App.css";

// Import Google Fonts
const link = document.createElement("link");
link.rel = "stylesheet";
link.href =
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500&family=Roboto+Mono&display=swap";
document.head.appendChild(link);

// Remove StrictMode to prevent double initialization
ReactDOM.createRoot(document.getElementById("root")).render(<App />);

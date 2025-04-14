import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
// Import Leaflet CSS at the entry point BEFORE your app CSS
import "leaflet/dist/leaflet.css";
import "./styles/map.css";
import "./App.css";

// Remove StrictMode to prevent double initialization
ReactDOM.createRoot(document.getElementById("root")).render(<App />);

import React, { useState, useEffect } from "react";
import MapViewer from "./components/MapViewer.jsx";
import ControlPanel from "./components/ControlPanel.jsx";
import { loadCOG, loadStressGeoJSON } from "./services/dataLoader.js";
import "./App.css";

function App() {
  const [gridSize, setGridSize] = useState(20);
  const [showHotspots, setShowHotspots] = useState(false);
  const [stressData, setStressData] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [cogData, setCogData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStressFile, setSelectedStressFile] = useState(
    "/data/stress_sample.json"
  );
  const availableStressFiles = [
    { name: "Sample Data 1", url: "/data/stress_sample.json" },
    { name: "Sample Data 2", url: "/api/stress-data" },
  ];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        // Get COG URL from environment config
        const cogUrl = window.env?.REACT_APP_COG_URL || "";
        console.log("Loading COG from URL:", cogUrl);

        if (cogUrl && cogUrl !== "sample") {
          // Load actual COG data
          const cogResult = await loadCOG(cogUrl);
          setCogData(cogResult);
          console.log("COG data loaded successfully", cogResult);
        }

        // Load stress data from selected GeoJSON
        console.log("Loading stress data from:", selectedStressFile);
        const data = await loadStressGeoJSON(selectedStressFile);
        console.log("Loaded stress data:", data.length, "points");

        setStressData(data);

        // Calculate hotspots (stress > 0.7)
        const spots = data.filter((point) => point.stress > 0.7);
        console.log("Found", spots.length, "hotspots");
        setHotspots(spots);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [selectedStressFile]); // Reload when stress file changes

  // Calculate average stress
  const avgStress = stressData.length
    ? (
        (stressData.reduce((sum, point) => sum + point.stress, 0) /
          stressData.length) *
        100
      ).toFixed(1)
    : "0.0";

  return (
    <div className="app">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading geospatial data...</div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <MapViewer
        cogData={cogData}
        stressData={stressData}
        gridSize={gridSize}
        showStressedAreas={showHotspots}
        stressHotspots={hotspots}
      />

      <ControlPanel
        gridSizes={[10, 20, 50, 100]}
        selectedGridSize={gridSize}
        onGridSizeChange={setGridSize}
        showStressedAreas={showHotspots}
        onToggleStressedAreas={() => setShowHotspots(!showHotspots)}
        pointCount={stressData.length}
        hotspotCount={hotspots.length}
        avgStress={avgStress}
        stressFiles={availableStressFiles}
        selectedStressFile={selectedStressFile}
        onStressFileChange={setSelectedStressFile}
      />
    </div>
  );
}

export default App;

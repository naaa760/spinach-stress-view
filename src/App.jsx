import React, { useState, useEffect } from "react";
import MapViewer from "./components/MapViewer.jsx";
import ControlPanel from "./components/ControlPanel.jsx";
import { loadCOG, loadStressGeoJSON } from "./services/dataLoader.js";
import "./App.css";

// Get environment variables
const COG_URL = window.env?.REACT_APP_COG_URL || "";
const GEOJSON_URL = window.env?.REACT_APP_GEOJSON_URL || "";
const USE_SAMPLE_DATA = window.env?.REACT_APP_USE_SAMPLE_DATA === "true";

function App() {
  const [gridSize, setGridSize] = useState(20);
  const [showHotspots, setShowHotspots] = useState(false);
  const [stressData, setStressData] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [cogData, setCogData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data when component mounts
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        // Load COG data
        if (COG_URL && !USE_SAMPLE_DATA) {
          const cogResult = await loadCOG(COG_URL);
          setCogData(cogResult);
        }

        // Load stress data from GeoJSON
        let data;
        if (GEOJSON_URL && !USE_SAMPLE_DATA) {
          data = await loadStressGeoJSON(GEOJSON_URL);
        } else {
          // Import sample data dynamically only if needed
          const { sampleStressData } = await import("./data/sampleData.js");
          data = sampleStressData;
          console.warn(
            "Using sample stress data. For production, set real GEOJSON_URL."
          );
        }

        setStressData(data);

        // Calculate hotspots
        const spots = data.filter((point) => point.stress > 0.7);
        setHotspots(spots);

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(`Failed to load data: ${err.message}`);
        setIsLoading(false);

        // Fall back to sample data on error
        try {
          const { sampleStressData } = await import("./data/sampleData.js");
          setStressData(sampleStressData);
          setHotspots(sampleStressData.filter((point) => point.stress > 0.7));
        } catch (fallbackError) {
          console.error("Even fallback data failed:", fallbackError);
        }
      }
    }

    loadData();
  }, []);

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
        avgStress={
          stressData.length
            ? (
                (stressData.reduce((sum, point) => sum + point.stress, 0) /
                  stressData.length) *
                100
              ).toFixed(1)
            : "0.0"
        }
      />
    </div>
  );
}

export default App;

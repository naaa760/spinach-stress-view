import React, { useState, useEffect } from "react";
import MapViewer from "./components/MapViewer.jsx";
import ControlPanel from "./components/ControlPanel.jsx";
import { sampleStressData } from "./data/sampleData.js";
import "./App.css";

function App() {
  const [gridSize, setGridSize] = useState(20);
  const [showHotspots, setShowHotspots] = useState(false);
  const [stressData] = useState(sampleStressData);
  const [hotspots, setHotspots] = useState([]);

  // Calculate hotspots when data or threshold changes
  useEffect(() => {
    if (stressData) {
      const spots = stressData.filter((point) => point.stress > 0.7);
      setHotspots(spots);
    }
  }, [stressData]);

  return (
    <div className="app">
      <MapViewer
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
      />
    </div>
  );
}

export default App;

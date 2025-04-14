import React from "react";
import { Circle, Tooltip } from "react-leaflet";
import LeafletHeatmap from "./LeafletHeatmap.jsx";

const StressHeatmap = ({ data, gridSize, showHotspots, hotspots }) => {
  if (!data || data.length === 0) return null;

  // Convert stress values for the heatmap (invert if needed - low values mean high stress)
  const points = data.map((point) => ({
    lat: point.latitude,
    lng: point.longitude,
    intensity: 1 - point.stress, // Invert so high stress (low values) gets high intensity
  }));

  return (
    <>
      {/* Heatmap Layer */}
      <LeafletHeatmap
        points={points}
        intensityExtractor={(point) => point.intensity}
        radiusValue={gridSize * 2}
        blur={15}
        maxValue={1.0}
      />

      {/* Hotspot Markers */}
      {showHotspots &&
        hotspots &&
        hotspots.map((point, index) => (
          <Circle
            key={index}
            center={[point.latitude, point.longitude]}
            radius={gridSize}
            pathOptions={{
              color: "red",
              fillColor: "#f03",
              fillOpacity: 0.5,
            }}
          >
            <Tooltip>Stress Level: {(point.stress * 100).toFixed(1)}%</Tooltip>
          </Circle>
        ))}
    </>
  );
};

export default StressHeatmap;

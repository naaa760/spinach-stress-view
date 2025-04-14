import React, { useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet.heat";
import StressHeatmap from "./StressHeatmap.jsx";

// Fix the icon paths
L.Icon.Default.imagePath = "/";

const MapViewer = ({
  stressData,
  gridSize,
  showStressedAreas,
  stressHotspots,
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const heatLayerRef = useRef(null);

  // Initialize map when component mounts
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Create map
      mapInstance.current = L.map(mapRef.current).setView(
        [37.7749, -122.4194],
        13
      );

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstance.current);
    }

    // Clean up on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update heat layer when stress data changes
  useEffect(() => {
    if (!mapInstance.current || !stressData || stressData.length === 0) return;

    // Clean up previous layer
    if (heatLayerRef.current) {
      mapInstance.current.removeLayer(heatLayerRef.current);
    }

    // Create heat points
    const heatPoints = stressData.map((point) => [
      point.latitude,
      point.longitude,
      1 - point.stress, // Invert so high stress gets higher intensity
    ]);

    // Create heat layer
    heatLayerRef.current = L.heatLayer(heatPoints, {
      radius: gridSize * 2,
      blur: 15,
      max: 1.0,
      gradient: {
        0.4: "blue",
        0.6: "lime",
        0.7: "yellow",
        0.8: "orange",
        1.0: "red",
      },
    }).addTo(mapInstance.current);

    // Add hotspots if enabled
    if (showStressedAreas && stressHotspots) {
      stressHotspots.forEach((point) => {
        L.circle([point.latitude, point.longitude], {
          radius: gridSize,
          color: "red",
          fillColor: "#f03",
          fillOpacity: 0.5,
        })
          .addTo(mapInstance.current)
          .bindTooltip(`Stress Level: ${(point.stress * 100).toFixed(1)}%`);
      });
    }
  }, [stressData, gridSize, showStressedAreas, stressHotspots]);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default MapViewer;

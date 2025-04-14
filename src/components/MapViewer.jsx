import React, { useRef, useEffect, useState } from "react";
import L from "leaflet";
import "leaflet.heat";
import { FaLeaf, FaLocationArrow } from "react-icons/fa";

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
  const markersRef = useRef([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  // Initialize map when component mounts
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Create map with custom zoom control position
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([37.7749, -122.4194], 13);

      // Add custom position for zoom controls with custom styling
      const zoomControl = L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(mapInstance.current);

      // Style the zoom control
      const zoomInButton = zoomControl
        .getContainer()
        .querySelector(".leaflet-control-zoom-in");
      const zoomOutButton = zoomControl
        .getContainer()
        .querySelector(".leaflet-control-zoom-out");
      if (zoomInButton && zoomOutButton) {
        zoomInButton.style.color = "#43a047";
        zoomInButton.style.fontWeight = "bold";
        zoomOutButton.style.color = "#43a047";
        zoomOutButton.style.fontWeight = "bold";
      }

      // Add custom attribution in better position
      L.control
        .attribution({
          position: "bottomleft",
        })
        .addAttribution(
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Spinach Field Analysis'
        )
        .addTo(mapInstance.current);

      // Add tile layer with subtle styling
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        opacity: 0.85,
      }).addTo(mapInstance.current);

      // Add a scale control with custom styling
      L.control
        .scale({ position: "bottomright", imperial: false })
        .addTo(mapInstance.current);

      // Add coordinate display
      mapInstance.current.on("mousemove", (e) => {
        setCoordinates({
          lat: e.latlng.lat.toFixed(6),
          lng: e.latlng.lng.toFixed(6),
        });
      });

      // Set loaded state
      setTimeout(() => setIsMapLoaded(true), 500);
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

    // Clean up previous layer and markers
    if (heatLayerRef.current) {
      mapInstance.current.removeLayer(heatLayerRef.current);
    }

    markersRef.current.forEach((marker) => {
      if (mapInstance.current.hasLayer(marker)) {
        mapInstance.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    // Create heat points with enhanced customization
    const heatPoints = stressData.map((point) => [
      point.latitude,
      point.longitude,
      1 - point.stress, // Invert so high stress gets higher intensity
    ]);

    // Create heat layer with enhanced styling
    heatLayerRef.current = L.heatLayer(heatPoints, {
      radius: gridSize * 2,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.3: "#3388ff",
        0.5: "#5ae639",
        0.7: "#ffff00",
        0.8: "#ffaa00",
        1.0: "#ff3300",
      },
    }).addTo(mapInstance.current);

    // Add hotspots if enabled with enhanced styling
    if (showStressedAreas && stressHotspots) {
      stressHotspots.forEach((point) => {
        // Add pulsing effect for hotspots
        const marker = L.circleMarker([point.latitude, point.longitude], {
          radius: 8,
          color: "#ff3300",
          weight: 2,
          fillColor: "#ff3300",
          fillOpacity: 0.7,
          className: "hotspot-marker",
        })
          .addTo(mapInstance.current)
          .bindTooltip(
            `<div class="custom-tooltip-content">
              <div class="tooltip-header">Stress Hotspot</div>
              <div class="tooltip-body">
                <strong>Stress Level: ${(point.stress * 100).toFixed(
                  1
                )}%</strong>
                <div class="tooltip-location">
                  <small>Location: ${point.latitude.toFixed(
                    4
                  )}, ${point.longitude.toFixed(4)}</small>
                </div>
                <div class="tooltip-stress-bar" style="width: ${
                  point.stress * 100
                }%"></div>
              </div>
            </div>`,
            {
              direction: "top",
              className: "custom-tooltip",
              opacity: 0.9,
            }
          );

        markersRef.current.push(marker);
      });
    }
  }, [stressData, gridSize, showStressedAreas, stressHotspots]);

  return (
    <div
      className="gradient-bg"
      style={{ width: "100%", height: "100vh", position: "relative" }}
    >
      <div className={`app-header ${isMapLoaded ? "fade-in" : ""}`}>
        <h1 className="app-title">
          <FaLeaf style={{ color: "#43a047" }} /> Spinach Field Stress
          Visualizer
        </h1>
        <p className="app-description">
          Interactive visualization of stress levels across spinach fields
        </p>
      </div>

      {/* Coordinates display */}
      <div className="coordinates-display">
        <FaLocationArrow /> {coordinates.lat}, {coordinates.lng}
      </div>

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* Add a subtle overlay for visual enhancement */}
      <div className="map-overlay"></div>
    </div>
  );
};

export default MapViewer;

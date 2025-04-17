import React, { useRef, useEffect, useState } from "react";
import L from "leaflet";
import "leaflet.heat";
import { FaLeaf, FaLocationArrow } from "react-icons/fa";

L.Icon.Default.imagePath = "/";

const MapViewer = ({
  cogData,
  stressData,
  gridSize,
  showStressedAreas,
  stressHotspots,
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const heatLayerRef = useRef(null);
  const cogLayerRef = useRef(null);
  const markersRef = useRef([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 10,
        maxZoom: 22,
        zoom: 18, // Adjust initial zoom to match approximately 20m scale
      });

      const zoomControl = L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(mapInstance.current);

      // Style zoom controls
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

      L.control
        .attribution({
          position: "bottomleft",
        })
        .addAttribution(
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://cogeo.org/">COG</a> | Spinach Field Analysis'
        )
        .addTo(mapInstance.current);

      // Reduce opacity of base map to ensure TIFF is more visible
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        opacity: 0.3, // Reduce base map opacity
      }).addTo(mapInstance.current);

      // Add scale
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

      setTimeout(() => setIsMapLoaded(true), 500);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !cogData) return;

    if (cogLayerRef.current) {
      mapInstance.current.removeLayer(cogLayerRef.current);
      cogLayerRef.current = null;
    }

    try {
      if (cogData.bbox) {
        const [minX, minY, maxX, maxY] = cogData.bbox;
        const bounds = [
          [minY, minX],
          [maxY, maxX],
        ];

        // Set view with higher zoom
        mapInstance.current.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 22,
        });

        // Display TIFF with full opacity as base layer
        if (cogData.image) {
          console.log("Loading TIFF image...");

          // Create a URL for the TIFF blob
          const tiffUrl = URL.createObjectURL(
            new Blob([cogData.image], { type: "image/tiff" })
          );

          // Log the URL to verify it's created
          console.log("TIFF URL created:", tiffUrl);

          // Create and add the image overlay with proper z-index
          cogLayerRef.current = L.imageOverlay(tiffUrl, bounds, {
            opacity: 1.0, // Full opacity for base layer
            zIndex: 10, // Lower zIndex to stay under grid
            crossOrigin: true,
            interactive: false,
          }).addTo(mapInstance.current);

          console.log("TIFF layer added to map");
        } else {
          console.warn("No image data in cogData");
        }
      } else {
        console.warn("No bbox in cogData");
      }
    } catch (err) {
      console.error("Error displaying COG:", err);
    }
  }, [cogData]);

  // Update stress heatmap
  useEffect(() => {
    if (!mapInstance.current || !stressData || stressData.length === 0) return;

    // Clean up previous layers
    if (heatLayerRef.current) {
      mapInstance.current.removeLayer(heatLayerRef.current);
    }

    markersRef.current.forEach((marker) => {
      if (mapInstance.current.hasLayer(marker)) {
        mapInstance.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    // Create agricultural field grid layer
    const gridLayer = L.layerGroup().addTo(mapInstance.current);

    // Gather field boundaries
    let minLat = Infinity,
      maxLat = -Infinity;
    let minLng = Infinity,
      maxLng = -Infinity;

    stressData.forEach((point) => {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    });

    // Add small buffer
    const latBuffer = (maxLat - minLat) * 0.05;
    const lngBuffer = (maxLng - minLng) * 0.05;

    // Field dimensions with buffer
    const fieldMinLat = minLat - latBuffer;
    const fieldMaxLat = maxLat + latBuffer;
    const fieldMinLng = minLng - lngBuffer;
    const fieldMaxLng = maxLng + lngBuffer;

    // Adjust number of rows/columns based on gridSize
    const baseRows = 12;
    const baseCols = 18;

    // Scale rows and columns inversely with gridSize
    // Increase cell size significantly when gridSize is 50
    const scaleFactor = gridSize === 50 ? 0.4 : 50 / gridSize; // Reduce number of cells for 50m
    const numRows = Math.max(6, Math.round(baseRows * scaleFactor));
    const numCols = Math.max(9, Math.round(baseCols * scaleFactor));

    const cellHeight = (fieldMaxLat - fieldMinLat) / numRows;
    const cellWidth = (fieldMaxLng - fieldMinLng) / numCols;

    // Simple colors for clear visibility
    const greenColor = "#4CAF50"; // Bright green for crops
    const brownColor = "#8D6E63"; // Brown for soil rows

    // Create the grid with larger cells
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const lat = fieldMinLat + row * cellHeight;
        const lng = fieldMinLng + col * cellWidth;

        // Determine if this is a soil row (brown) or crop area (green)
        // Create brown rows at positions that scale with grid size
        const rowPosition = row / numRows;
        const isSoilRow =
          (rowPosition > 0.15 && rowPosition < 0.25) || // Top brown row
          (rowPosition > 0.45 && rowPosition < 0.55) || // Middle brown row
          (rowPosition > 0.75 && rowPosition < 0.85); // Bottom brown row

        // Create cell
        const bounds = [
          [lat, lng],
          [lat + cellHeight, lng + cellWidth],
        ];

        // Find the stress value for this cell from the data
        const cellCenterLat = lat + cellHeight / 2;
        const cellCenterLng = lng + cellWidth / 2;

        // Find the closest stress data point to this cell
        let closestPoint = null;
        let minDistance = Infinity;
        let stressValue = 0;

        stressData.forEach((point) => {
          const distance = Math.sqrt(
            Math.pow(point.latitude - cellCenterLat, 2) +
              Math.pow(point.longitude - cellCenterLng, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = point;
            stressValue = point.stress;
          }
        });

        // Create rectangle with clear colors and stress-based coloring
        const stressColor = getStressColor(stressValue);
        const rectangle = L.rectangle(bounds, {
          color: "#FFFFFF",
          weight: 1,
          fillColor: isSoilRow ? brownColor : stressColor,
          fillOpacity: 0.6,
          className: "farm-grid-cell",
          zIndex: 20,
        }).addTo(gridLayer);

        // Enhanced tooltip with stress value
        rectangle.bindTooltip(
          `<div class="farm-tooltip">
            <strong>${isSoilRow ? "Soil Row" : "Crop Area"}</strong><br>
            <span>Grid: ${gridSize}cm</span><br>
            <span>Stress: ${(stressValue * 100).toFixed(1)}%</span>
          </div>`,
          {
            direction: "top",
            className: "custom-tooltip",
          }
        );
      }
    }

    // Set initial zoom level based on field size
    const bounds = [
      [fieldMinLat, fieldMinLng],
      [fieldMaxLat, fieldMaxLng],
    ];

    // Always fit bounds to show the entire field
    mapInstance.current.fitBounds(bounds, {
      padding: [20, 20],
      maxZoom: 18, // Limit max zoom to match 20m scale
    });

    // Set higher zoom level for better grid inspection
    setTimeout(() => {
      const center = mapInstance.current.getCenter();

      // Set zoom to match approximately 20m scale
      // Zoom level 18-19 typically shows around 20m scale at mid-latitudes
      mapInstance.current.setView(center, 18);

      // Add a scale control to verify the scale
      if (!document.querySelector(".leaflet-control-scale")) {
        L.control
          .scale({
            position: "bottomright",
            imperial: false,
            maxWidth: 200,
          })
          .addTo(mapInstance.current);
      }
    }, 400);

    // Add hotspot markers if enabled
    if (showStressedAreas && stressHotspots) {
      stressHotspots.forEach((point) => {
        const marker = L.circleMarker([point.latitude, point.longitude], {
          radius: 10,
          color: "#ff0000",
          weight: 3,
          fillColor: "#ff3300",
          fillOpacity: 0.8,
          className: "hotspot-marker pulse",
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
  }, [stressData, gridSize, showStressedAreas, stressHotspots, cogData]);

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
          Visualizing plant stress using Cloud Optimized GeoTIFF data
        </p>
      </div>

      <div className="coordinates-display">
        <FaLocationArrow /> {coordinates.lat}, {coordinates.lng}
      </div>

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      <div className="map-overlay"></div>
    </div>
  );
};

function getStressColor(stress) {
  // Color gradient from green (low stress) to red (high stress)
  if (stress < 0.2) return "#4CAF50"; // Low stress - green
  if (stress < 0.4) return "#8BC34A"; // Low-medium stress - light green
  if (stress < 0.6) return "#FFEB3B"; // Medium stress - yellow
  if (stress < 0.8) return "#FF9800"; // Medium-high stress - orange
  return "#F44336"; // High stress - red
}

export default MapViewer;

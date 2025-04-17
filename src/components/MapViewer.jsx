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
        maxZoom: 22, // Higher max zoom to see details
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
          maxZoom: 19, // Force a higher zoom level
        });

        // Display TIFF with full opacity as base layer
        if (cogData.image) {
          cogLayerRef.current = L.imageOverlay(
            URL.createObjectURL(
              new Blob([cogData.image], { type: "image/tiff" })
            ),
            bounds,
            {
              opacity: 1.0, // Full opacity to ensure visibility
              zIndex: 10, // Position above base map
            }
          ).addTo(mapInstance.current);

          // Force higher zoom level after slight delay to ensure proper rendering
          setTimeout(() => {
            const currentZoom = mapInstance.current.getZoom();
            if (currentZoom < 18) {
              mapInstance.current.setZoom(18);
            }
          }, 500);
        }
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
    // Fewer cells for larger grid sizes, more cells for smaller grid sizes
    const baseRows = 12;
    const baseCols = 18;

    // Scale rows and columns inversely with gridSize
    // This ensures proper grid resolution representation
    const numRows = Math.max(6, Math.round(baseRows * (50 / gridSize)));
    const numCols = Math.max(9, Math.round(baseCols * (50 / gridSize)));

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

        // Create rectangle with clear colors
        const rectangle = L.rectangle(bounds, {
          color: "#FFFFFF", // White borders
          weight: 1, // Thicker borders for visibility
          fillColor: isSoilRow ? brownColor : greenColor,
          fillOpacity: 0.9,
          className: "farm-grid-cell",
        }).addTo(gridLayer);

        // Simple tooltip with grid size information
        rectangle.bindTooltip(
          `<div class="farm-tooltip">
            <strong>${isSoilRow ? "Soil Row" : "Crop Area"}</strong><br>
            <span>Grid: ${gridSize}cm</span>
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
      maxZoom: 16, // Limit max zoom to ensure grid visibility
    });

    // Force update to exactly 20m view after initial load
    setTimeout(() => {
      // Set view to exact 20m scale with zoom level 18 (approximately 20m scale)
      mapInstance.current.setView(mapInstance.current.getCenter(), 18);

      // After zoom is set, verify the scale with scale control
      const scaleControl = L.control
        .scale({
          position: "bottomright",
          maxWidth: 100,
          metric: true,
          imperial: false,
          updateWhenIdle: false,
        })
        .addTo(mapInstance.current);

      // Ensure the scale shows 20m
      const scaleElement = scaleControl.getContainer();
      if (scaleElement) {
        // This will show the current scale in meters
        console.log("Current scale:", scaleElement.textContent);
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

export default MapViewer;

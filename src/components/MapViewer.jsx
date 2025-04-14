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
      });

      // Don't set view yet - wait for COG data or stress data to determine bounds

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

      // Add basemap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        opacity: 0.85,
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

  // Handle COG data
  useEffect(() => {
    if (!mapInstance.current || !cogData) return;

    // Clean up previous COG layer
    if (cogLayerRef.current) {
      mapInstance.current.removeLayer(cogLayerRef.current);
      cogLayerRef.current = null;
    }

    try {
      // Get bounds from COG
      if (cogData.bbox) {
        const [minX, minY, maxX, maxY] = cogData.bbox;
        const bounds = [
          [minY, minX],
          [maxY, maxX],
        ];

        // Set view to COG bounds
        mapInstance.current.fitBounds(bounds);

        // If COG has image data, display it
        if (cogData.image) {
          // Create overlay for the COG with higher opacity
          cogLayerRef.current = L.imageOverlay(
            URL.createObjectURL(
              new Blob([cogData.image], { type: "image/tiff" })
            ),
            bounds,
            { opacity: 0.9 } // Increase opacity from default
          ).addTo(mapInstance.current);
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

    // Create heat points
    const heatPoints = stressData.map((point) => [
      point.latitude,
      point.longitude,
      1 - point.stress, // Invert so high stress gets higher intensity
    ]);

    // If no COG bounds have set the view yet, use stress data to set bounds
    if (!cogData?.bbox && heatPoints.length > 0) {
      // Calculate bounds from stress data points
      const latitudes = stressData.map((p) => p.latitude);
      const longitudes = stressData.map((p) => p.longitude);

      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      const bounds = [
        [minLat, minLng],
        [maxLat, maxLng],
      ];

      mapInstance.current.fitBounds(bounds, {
        padding: [50, 50],
      });
    }

    // Create heatmap layer
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

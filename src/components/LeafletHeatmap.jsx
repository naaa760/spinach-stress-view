import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

const LeafletHeatmap = ({
  points,
  intensityExtractor,
  radiusValue = 25,
  blur = 15,
  maxValue = 1.0,
}) => {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    // Clean up previous layer if it exists
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Format points for the heat layer
    const heatPoints = points.map((point) => {
      const intensity = intensityExtractor ? intensityExtractor(point) : 1;
      return [point.lat, point.lng, intensity];
    });

    // Create and add the heat layer
    const heatLayer = L.heatLayer(heatPoints, {
      radius: radiusValue,
      blur: blur,
      max: maxValue,
      gradient: {
        0.4: "blue",
        0.6: "lime",
        0.7: "yellow",
        0.8: "orange",
        1.0: "red",
      },
    });

    heatLayer.addTo(map);
    heatLayerRef.current = heatLayer;

    // Clean up on unmount
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points, intensityExtractor, radiusValue, blur, maxValue]);

  return null;
};

export default LeafletHeatmap;

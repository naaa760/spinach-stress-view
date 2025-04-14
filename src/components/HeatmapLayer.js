import { CompositeLayer } from "@deck.gl/core";
import { GridLayer } from "@deck.gl/aggregation-layers";
import { scaleSequential } from "d3-scale";
import { interpolateRdYlGn } from "d3-scale-chromatic";
import { ScatterplotLayer } from "@deck.gl/layers";

class HeatmapLayer extends CompositeLayer {
  renderLayers() {
    const {
      data,
      gridSize = 20,
      showStressedAreas,
      stressHotspots,
    } = this.props;

    const colorScale = scaleSequential((t) => interpolateRdYlGn(1 - t)).domain([
      0, 1,
    ]);

    const layers = [
      new GridLayer({
        id: `${this.props.id}-grid`,
        data,
        getPosition: (d) => [d.longitude, d.latitude],
        getColorValue: (d) => d.stress,
        colorScaleType: "sequential",
        colorRange: Array.from({ length: 6 }, (_, i) => {
          const t = i / 5;
          const color = colorScale(t);

          const match = color.match(
            /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.?\d*))?\)/
          );
          if (match) {
            const [_, r, g, b, a] = match;
            return [r, g, b, a ? a * 255 : 255];
          }
          return [255, 0, 0, 255];
        }),
        pickable: true,
        cellSize: gridSize,
        extruded: false,
        opacity: 0.7,
        coverage: 1,
        // Highlight areas with the high stress (low values)
        upperPercentile: 100,
        lowerPercentile: 0,
      }),
    ];

    // I am adding stressed area highlighting if enabled
    if (showStressedAreas && stressHotspots && stressHotspots.length > 0) {
      layers.push(
        new ScatterplotLayer({
          id: `${this.props.id}-hotspots`,
          data: stressHotspots,
          getPosition: (d) => [d.longitude, d.latitude],
          getFillColor: [255, 0, 0, 128],
          getLineColor: [255, 0, 0, 255],
          getRadius: gridSize * 2,
          lineWidthMinPixels: 2,
          stroked: true,
          pickable: true,
          radiusScale: 1,
          radiusMinPixels: 10,
          radiusMaxPixels: 100,
          // I am adding a pulsing effect
          updateTriggers: {
            getRadius: { time: Date.now() % 1000 }, // Makes the layer update frequently
          },
        })
      );
    }

    return layers;
  }
}

export default HeatmapLayer;

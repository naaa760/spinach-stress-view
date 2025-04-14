// Create a grid of data points around a center point
const createGridPoints = (centerLat, centerLng, gridSize, rows, cols) => {
  const points = [];
  const latStep = 0.005;
  const lngStep = 0.005;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const latitude = centerLat - (rows / 2) * latStep + i * latStep;
      const longitude = centerLng - (cols / 2) * lngStep + j * lngStep;

      // Create some interesting patterns in the stress data
      let stress = Math.random();

      // Add some hotspots
      if (
        (i === Math.floor(rows / 3) && j === Math.floor(cols / 3)) ||
        (i === Math.floor((rows * 2) / 3) && j === Math.floor((cols * 2) / 3))
      ) {
        stress = 0.85; // Hotspot
      }

      points.push({
        latitude,
        longitude,
        stress,
      });
    }
  }

  return points;
};

export const sampleStressData = createGridPoints(
  37.7749,
  -122.4194,
  20,
  20,
  20
);

export const sampleCogMetadata = {
  width: 1000,
  height: 1000,
  bbox: [-122.47, 37.76, -122.37, 37.79],
  data: new ArrayBuffer(4), // Minimal data since we're not displaying image
};

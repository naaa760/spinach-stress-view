import { fromUrl } from "geotiff";

export async function loadCOG(url) {
  try {
    if (!url || url === "sample") {
      throw new Error("No COG URL provided");
    }

    console.log("Loading COG from:", url);
    const tiff = await fromUrl(url);
    const image = await tiff.getImage();
    const bbox = image.getBoundingBox();
    const width = image.getWidth();
    const height = image.getHeight();

    // Get the data as an ArrayBuffer instead of reading all rasters
    // This is more efficient for large COGs
    const fileDirectory = image.getFileDirectory();

    console.log("COG metadata loaded successfully:", {
      width,
      height,
      bbox,
      resolution: image.getResolution(),
      sampleFormat: fileDirectory.SampleFormat,
      bitsPerSample: fileDirectory.BitsPerSample,
    });

    return {
      image,
      bbox,
      width,
      height,
      fileDirectory,
    };
  } catch (error) {
    console.error("Error loading COG:", error);
    throw error;
  }
}

export async function loadStressData(url) {
  try {
    if (url.startsWith("file:///")) {
      console.warn(
        "Local file paths can't be accessed directly via fetch. Using a proxy or sample data instead."
      );
      throw new Error("Local file paths not supported directly");
    }

    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading stress data:", error);
    throw error;
  }
}

export async function loadStressGeoJSON(url) {
  try {
    console.log("Loading stress GeoJSON from:", url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch GeoJSON: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Process GeoJSON into stress data format
    let stressData = [];

    if (data.type === "FeatureCollection") {
      stressData = data.features.map((feature) => {
        let latitude, longitude, stress;

        // Handle Point geometry
        if (feature.geometry.type === "Point") {
          [longitude, latitude] = feature.geometry.coordinates;
        }
        // Handle Polygon geometry (use centroid)
        else if (feature.geometry.type === "Polygon") {
          // Simple centroid calculation for demo
          const coords = feature.geometry.coordinates[0]; // Outer ring
          let sumLat = 0,
            sumLng = 0;
          coords.forEach((coord) => {
            sumLng += coord[0];
            sumLat += coord[1];
          });
          longitude = sumLng / coords.length;
          latitude = sumLat / coords.length;
        }

        // Get stress/value from properties
        if (feature.properties.stress !== undefined) {
          stress = feature.properties.stress;
        } else if (feature.properties.value !== undefined) {
          // Normalize value between 0-1 if it's not already
          stress = Math.min(Math.max(feature.properties.value, 0), 1);
        } else {
          stress = 0.5; // Default value
        }

        return {
          latitude,
          longitude,
          stress,
          properties: feature.properties, // Keep original properties
        };
      });
    }

    console.log(
      `Processed ${stressData.length} stress data points from GeoJSON`
    );
    return stressData;
  } catch (error) {
    console.error("Error loading stress GeoJSON:", error);
    throw error;
  }
}

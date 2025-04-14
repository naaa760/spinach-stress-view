import { fromUrl } from "geotiff";
import { sampleCogMetadata } from "../data/sampleData";

export async function loadCOG(url) {
  try {
    // If we're using sample data, return it directly
    if (typeof url === "object" && url.bbox) {
      return url;
    }

    const tiff = await fromUrl(url);
    const image = await tiff.getImage();
    const bbox = image.getBoundingBox();
    const data = await image.readRasters();

    return {
      image,
      bbox,
      data,
      width: image.getWidth(),
      height: image.getHeight(),
    };
  } catch (error) {
    console.error("Error loading COG:", error);
    // I am returning sample data as fallback
    console.log("Using sample COG metadata as fallback");
    return sampleCogMetadata;
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

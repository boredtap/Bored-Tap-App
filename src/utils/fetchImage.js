// utils/fetchImage.js
import { BASE_URL } from "./BaseVariables";
const imageCache = new Map();

export const fetchImage = async (
  imageId,
  token,
  type = "image",
  defaultImage = `${process.env.PUBLIC_URL}/default-reward-icon.png`
) => {
  if (!imageId) return defaultImage;
  const cacheKey = `${imageId}-${type}-${token}`;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);
  try {
    console.log(`Fetching ${type} image with ID: ${imageId}`); // Debug log
    const response = await fetch(
      `${BASE_URL}/bored-tap/user_app/image?image_id=${imageId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) throw new Error(`Failed to fetch ${type} image: ${response.status}`);
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    imageCache.set(cacheKey, imageUrl);
    return imageUrl;
  } catch (err) {
    console.error(`Error fetching ${type} image:`, err);
    return defaultImage;
  }
};

export const clearImageCache = () => {
  imageCache.forEach((url) => URL.revokeObjectURL(url));
  imageCache.clear();
};
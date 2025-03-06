export const fetchClanImage = async (imageId, token) => {
    if (!imageId) return `${process.env.PUBLIC_URL}/default-clan-icon.png`;
    try {
      const response = await fetch(
        `https://bt-coins.onrender.com/bored-tap/user_app/image?image_id=${imageId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch image");
      const blob = await response.blob();
      return URL.createObjectURL(blob); // Convert blob to usable URL
    } catch (err) {
      console.error("Error fetching clan image:", err);
      return `${process.env.PUBLIC_URL}/default-clan-icon.png`;
    }
  };
/**
 * @fileOverview Location utility for identifying Kenyan counties.
 */

export async function getKenyanLocation(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve("Kenya");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Using OpenStreetMap Nominatim for free reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en'
              }
            }
          );
          const data = await response.json();
          const address = data.address;
          
          // Kenyan administrative levels: county is usually 'county', 'state', or 'region'
          const county = address.county || address.state || address.region || "Nairobi";
          const cleanCounty = county.replace(/ County| Sub-County/g, "").trim();
          
          resolve(`${cleanCounty}, Kenya`);
        } catch (error) {
          console.error("Geocoding error:", error);
          resolve("Kenya");
        }
      },
      (error) => {
        // Silently fallback if permission denied or error
        console.warn("Geolocation error or denied:", error);
        resolve("Kenya");
      },
      { timeout: 8000 }
    );
  });
}

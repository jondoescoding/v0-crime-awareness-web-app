import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Geocode an address to get latitude and longitude coordinates
 */
export const geocodeAddress = action({
  args: {
    address: v.string(),
    city: v.optional(v.string()),
    state: v.optional(v.string())
  },
  returns: v.object({
    success: v.boolean(),
    coordinates: v.optional(v.object({
      lat: v.number(),
      lng: v.number()
    })),
    formattedAddress: v.optional(v.string()),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    try {
      // Construct the full address query
      const fullAddress = args.city && args.state 
        ? `${args.address}, ${args.city}, ${args.state}`
        : args.address;

      // Use SerpAPI to geocode the address
      const response = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(fullAddress)}&location=${args.city || 'Austin'}, ${args.state || 'Texas'}, United States&api_key=${process.env.SERPAPI_KEY}`);
      
      if (!response.ok) {
        throw new Error(`SerpAPI request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract coordinates from SerpAPI response
      const result = data.local_results?.places?.[0];
      
      if (result?.gps_coordinates) {
        return {
          success: true,
          coordinates: {
            lat: result.gps_coordinates.latitude,
            lng: result.gps_coordinates.longitude
          },
          formattedAddress: result.address,
          error: undefined
        };
      } else {
        return {
          success: false,
          coordinates: undefined,
          formattedAddress: undefined,
          error: "No coordinates found for the provided address"
        };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      return {
        success: false,
        coordinates: undefined,
        formattedAddress: undefined,
        error: error instanceof Error ? error.message : "Unknown geocoding error"
      };
    }
  }
});

/**
 * Batch geocode multiple addresses
 */
export const batchGeocodeAddresses = action({
  args: {
    addresses: v.array(v.object({
      address: v.string(),
      city: v.optional(v.string()),
      state: v.optional(v.string())
    }))
  },
  returns: v.array(v.object({
    address: v.string(),
    success: v.boolean(),
    coordinates: v.optional(v.object({
      lat: v.number(),
      lng: v.number()
    })),
    formattedAddress: v.optional(v.string()),
    error: v.optional(v.string())
  })),
  handler: async (ctx, args) => {
    const results = [];
    
    for (const addressData of args.addresses) {
      const result = await ctx.runAction(api.geocoding.geocodeAddress, addressData);
      results.push({
        address: addressData.address,
        ...result
      });
    }
    
    return results;
  }
});

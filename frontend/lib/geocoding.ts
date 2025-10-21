type GeocodeParams = {
  incidentAddress?: string | null
  neighborhood?: string | null
  cityState?: string | null
  county?: string | null
}

type GeocodeResponse = {
  lat: number
  lng: number
}

const API_PATH = "/api/geocode"

// In-memory cache to prevent duplicate API calls for the same address
const geocodeCache = new Map<string, GeocodeResponse | null>()

function buildRequestBody(params: GeocodeParams) {
  return {
    incidentAddress: params.incidentAddress ?? null,
    neighborhood: params.neighborhood ?? null,
    cityState: params.cityState ?? null,
    county: params.county ?? null,
  }
}

function getCacheKey(params: GeocodeParams): string {
  return JSON.stringify({
    incidentAddress: params.incidentAddress ?? null,
    neighborhood: params.neighborhood ?? null,
    cityState: params.cityState ?? null,
    county: params.county ?? null,
  })
}

export async function geocodeFullAddress(params: GeocodeParams): Promise<GeocodeResponse | null> {
  const cacheKey = getCacheKey(params)
  
  // Check cache first to avoid redundant API calls
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) ?? null
  }

  try {
    const response = await fetch(API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildRequestBody(params)),
    })

    if (!response.ok) {
      // Cache the null result to avoid retrying failed addresses
      geocodeCache.set(cacheKey, null)
      return null
    }

    const data = (await response.json()) as GeocodeResponse

    if (
      typeof data.lat === "number" &&
      Number.isFinite(data.lat) &&
      typeof data.lng === "number" &&
      Number.isFinite(data.lng)
    ) {
      // Cache successful result
      geocodeCache.set(cacheKey, data)
      return data
    }

    // Cache null for invalid data
    geocodeCache.set(cacheKey, null)
    return null
  } catch (error) {
    console.error("Failed to geocode address", error)
    // Cache null for errors to avoid repeated failed attempts
    geocodeCache.set(cacheKey, null)
    return null
  }
}



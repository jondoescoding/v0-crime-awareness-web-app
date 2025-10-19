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

function buildRequestBody(params: GeocodeParams) {
  return {
    incidentAddress: params.incidentAddress ?? null,
    neighborhood: params.neighborhood ?? null,
    cityState: params.cityState ?? null,
    county: params.county ?? null,
  }
}

export async function geocodeFullAddress(params: GeocodeParams): Promise<GeocodeResponse | null> {
  try {
    const response = await fetch(API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildRequestBody(params)),
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as GeocodeResponse

    if (
      typeof data.lat === "number" &&
      Number.isFinite(data.lat) &&
      typeof data.lng === "number" &&
      Number.isFinite(data.lng)
    ) {
      return data
    }

    return null
  } catch (error) {
    console.error("Failed to geocode address", error)
    return null
  }
}



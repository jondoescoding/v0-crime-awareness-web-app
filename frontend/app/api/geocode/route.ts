import { NextRequest, NextResponse } from "next/server"

const SERPER_API_KEY = process.env.SERPER_API_KEY
const SERPER_ENDPOINT = "https://google.serper.dev/search"

type GeocodeRequestBody = {
  incidentAddress?: string | null
  neighborhood?: string | null
  cityState?: string | null
  county?: string | null
}

type SerperResult = {
  answerBox?: {
    latitude?: string
    longitude?: string
  }
  knowledgeGraph?: {
    latitude?: number
    longitude?: number
  }
  organic?: Array<{
    snippet?: string
    title?: string
  }>
}

type GeocodeResponse = {
  lat: number
  lng: number
}

const LAT_LNG_REGEX = /([-+]?\d{1,2}\.\d+)[^\d-+]+([-+]?\d{1,3}\.\d+)/

function extractFromText(text: string | undefined): GeocodeResponse | undefined {
  if (!text) {
    return undefined
  }

  const match = text.match(LAT_LNG_REGEX)
  if (!match) {
    return undefined
  }

  const lat = Number.parseFloat(match[1])
  const lng = Number.parseFloat(match[2])

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng }
  }

  return undefined
}

function buildQuery(body: GeocodeRequestBody): string {
  const parts = [body.incidentAddress, body.neighborhood, body.cityState, body.county]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))

  if (parts.length === 0) {
    return "Jamaica"
  }

  const joined = parts.join(", ")
  return `coordinates for ${joined} Jamaica`
}

async function callSerper(query: string): Promise<SerperResult | undefined> {
  if (!SERPER_API_KEY) {
    console.error("SERPER_API_KEY is not configured")
    return undefined
  }

  try {
    const response = await fetch(SERPER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": SERPER_API_KEY,
      },
      body: JSON.stringify({
        q: query,
        gl: "jm",
        hl: "en",
        num: 5,
      }),
    })

    if (!response.ok) {
      console.error("Serper request failed", response.status, await response.text())
      return undefined
    }

    const data: SerperResult = await response.json()
    return data
  } catch (error) {
    console.error("Serper request error", error)
    return undefined
  }
}

function extractCoordinates(data: SerperResult | undefined): GeocodeResponse | undefined {
  if (!data) {
    return undefined
  }

  const answerBoxCoordinates = extractFromText(data.answerBox?.latitude && data.answerBox?.longitude ? `${data.answerBox.latitude}, ${data.answerBox.longitude}` : undefined)
  if (answerBoxCoordinates) {
    return answerBoxCoordinates
  }

  if (data.knowledgeGraph?.latitude !== undefined && data.knowledgeGraph?.longitude !== undefined) {
    const lat = data.knowledgeGraph.latitude
    const lng = data.knowledgeGraph.longitude
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng }
    }
  }

  if (Array.isArray(data.organic)) {
    for (const result of data.organic) {
      const fromSnippet = extractFromText(result.snippet)
      if (fromSnippet) {
        return fromSnippet
      }

      const fromTitle = extractFromText(result.title)
      if (fromTitle) {
        return fromTitle
      }
    }
  }

  return undefined
}

export async function POST(request: NextRequest) {
  let body: GeocodeRequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const query = buildQuery(body)
  const serperResponse = await callSerper(query)
  const coordinates = extractCoordinates(serperResponse)

  if (!coordinates) {
    return NextResponse.json({ error: "Coordinates not found" }, { status: 404 })
  }

  return NextResponse.json(coordinates, { status: 200 })
}



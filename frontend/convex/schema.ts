import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  users: defineTable({
    username: v.string(),
    // Store a password hash in production.
    password: v.string(),
    createdAt: v.number(),
  }).index("by_username", ["username"]),

  locations: defineTable({
    coordinates: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    policeNumber: v.optional(v.string()),
    createdAt: v.number(),
  }),

  persons: defineTable({
    name: v.string(),
    imageStorageId: v.id("_storage"),
    alias: v.optional(v.string()),
    crime: v.optional(v.string()),
    // Location object with ids to the locations table
    location: v.object({
      official_location: v.optional(v.id("locations")),
      last_sighted: v.optional(v.id("locations")),
      // zero or more frequent locations
      frequents: v.array(v.id("locations")),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_createdAt", ["createdAt"]),

  criminals: defineTable({
    name: v.string(),
    headshotUrl: v.optional(v.string()),
    primaryCrime: v.string(),
    description: v.optional(v.string()),
    locationLat: v.optional(v.number()),
    locationLng: v.optional(v.number()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_name", ["name"]) 
    .index("by_createdAt", ["createdAt"]) 
    .index("by_primaryCrime", ["primaryCrime"]),

  crimeReports: defineTable({
    reportType: v.union(v.literal("existing_criminal"), v.literal("new_crime")),
    criminalId: v.optional(v.id("criminals")),
    criminalName: v.optional(v.string()),
    criminalHeadshot: v.optional(v.string()),
    criminalCrime: v.optional(v.string()),
    description: v.string(),
    offenseType: v.string(),
    incidentAddress: v.optional(v.string()),
    parish: v.optional(v.string()),
    cityState: v.string(),
    nearestIntersection: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    directionsToLocation: v.optional(v.string()),
    howHeardProgram: v.optional(v.string()),
    newsStoryLinks: v.optional(v.string()),
    additionalInfo: v.optional(v.string()),
    schoolRelated: v.boolean(),
    wantedFugitive: v.boolean(),
    suspectInfo: v.optional(v.string()),
    vehicleInfo: v.optional(v.string()),
    drugsInvolved: v.boolean(),
    abuseInvolved: v.boolean(),
    weaponsInvolved: v.boolean(),
    fileUploads: v.array(v.string()),
    fileDescriptions: v.array(v.string()),
    locationLat: v.optional(v.number()),
    locationLng: v.optional(v.number()),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"]) 
    .index("by_criminalId", ["criminalId"]) 
    .index("by_offenseType", ["offenseType"]) 
    .index("by_status", ["status"]),

  tips: defineTable({
    userId: v.optional(v.id("users")), // allow anonymous
    personId: v.id("persons"),
    locationId: v.id("locations"),
    details: v.string(),
    timeOfSighting: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_person", ["personId"])
    .index("by_location", ["locationId"])
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"]),
});
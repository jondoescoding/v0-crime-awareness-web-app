import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all crime reports with optional filtering
 */
export const list = query({
  args: {
    status: v.optional(v.string()),
    offenseType: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("crimeReports"),
      _creationTime: v.number(),
      reportType: v.union(v.literal("existing_criminal"), v.literal("new_crime")),
      criminalId: v.optional(v.id("criminals")),
      criminalName: v.optional(v.string()),
      criminalHeadshot: v.optional(v.string()),
      criminalCrime: v.optional(v.string()),
      description: v.string(),
      offenseType: v.string(),
      incidentAddress: v.optional(v.string()),
      county: v.optional(v.string()),
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
  ),
  handler: async (ctx, args) => {
    let reports;

    if (args.status) {
      reports = await ctx.db
        .query("crimeReports")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else if (args.offenseType) {
      reports = await ctx.db
        .query("crimeReports")
        .withIndex("by_offenseType", (q) => q.eq("offenseType", args.offenseType!))
        .order("desc")
        .collect();
    } else {
      reports = await ctx.db
        .query("crimeReports")
        .withIndex("by_createdAt")
        .order("desc")
        .collect();
    }

    return reports;
  },
});

/**
 * Create a new crime report
 */
export const create = mutation({
  args: {
    reportType: v.union(v.literal("existing_criminal"), v.literal("new_crime")),
    criminalId: v.optional(v.id("criminals")),
    description: v.string(),
    offenseType: v.string(),
    incidentAddress: v.optional(v.string()),
    county: v.optional(v.string()),
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
  },
  returns: v.id("crimeReports"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    let criminalName: string | undefined;
    let criminalHeadshot: string | undefined;
    let criminalCrime: string | undefined;

    // If reporting on an existing criminal, fetch their details
    if (args.criminalId) {
      const criminal = await ctx.db.get(args.criminalId);
      if (criminal) {
        criminalName = criminal.name;
        criminalHeadshot = criminal.headshotUrl;
        criminalCrime = criminal.primaryCrime;
      }
    }

    return await ctx.db.insert("crimeReports", {
      reportType: args.reportType,
      criminalId: args.criminalId,
      criminalName,
      criminalHeadshot,
      criminalCrime,
      description: args.description,
      offenseType: args.offenseType,
      incidentAddress: args.incidentAddress,
      county: args.county,
      cityState: args.cityState,
      nearestIntersection: args.nearestIntersection,
      neighborhood: args.neighborhood,
      directionsToLocation: args.directionsToLocation,
      howHeardProgram: args.howHeardProgram,
      newsStoryLinks: args.newsStoryLinks,
      additionalInfo: args.additionalInfo,
      schoolRelated: args.schoolRelated,
      wantedFugitive: args.wantedFugitive,
      suspectInfo: args.suspectInfo,
      vehicleInfo: args.vehicleInfo,
      drugsInvolved: args.drugsInvolved,
      abuseInvolved: args.abuseInvolved,
      weaponsInvolved: args.weaponsInvolved,
      fileUploads: args.fileUploads,
      fileDescriptions: args.fileDescriptions,
      locationLat: args.locationLat,
      locationLng: args.locationLng,
      status: "active",
      createdAt: now,
    });
  },
});

/**
 * Get reports for a specific criminal
 */
export const getByCriminal = query({
  args: {
    criminalId: v.id("criminals"),
  },
  returns: v.array(
    v.object({
      _id: v.id("crimeReports"),
      _creationTime: v.number(),
      reportType: v.union(v.literal("existing_criminal"), v.literal("new_crime")),
      criminalId: v.optional(v.id("criminals")),
      criminalName: v.optional(v.string()),
      criminalHeadshot: v.optional(v.string()),
      criminalCrime: v.optional(v.string()),
      description: v.string(),
      offenseType: v.string(),
      incidentAddress: v.optional(v.string()),
      county: v.optional(v.string()),
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
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crimeReports")
      .withIndex("by_criminalId", (q) => q.eq("criminalId", args.criminalId))
      .order("desc")
      .collect();
  },
});

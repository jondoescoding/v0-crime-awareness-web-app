import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all criminals with optional search and filtering
 */
export const list = query({
  args: {
    search: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("criminals"),
      _creationTime: v.number(),
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
  ),
  handler: async (ctx, args) => {
    let criminals = await ctx.db
      .query("criminals")
      .order("desc")
      .collect();

    // Filter by search if provided
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      criminals = criminals.filter(
        (criminal) =>
          criminal.name.toLowerCase().includes(searchLower) ||
          criminal.primaryCrime.toLowerCase().includes(searchLower) ||
          (criminal.description && criminal.description.toLowerCase().includes(searchLower))
      );
    }

    return criminals;
  },
});

/**
 * Get a single criminal by ID
 */
export const get = query({
  args: {
    id: v.id("criminals"),
  },
  returns: v.union(
    v.object({
      _id: v.id("criminals"),
      _creationTime: v.number(),
      name: v.string(),
      headshotUrl: v.optional(v.string()),
      primaryCrime: v.string(),
      description: v.optional(v.string()),
      locationLat: v.optional(v.number()),
      locationLng: v.optional(v.number()),
      status: v.string(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new criminal entry
 */
export const create = mutation({
  args: {
    name: v.string(),
    headshotUrl: v.optional(v.string()),
    primaryCrime: v.string(),
    description: v.optional(v.string()),
    locationLat: v.optional(v.number()),
    locationLng: v.optional(v.number()),
    status: v.string(),
  },
  returns: v.id("criminals"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("criminals", {
      name: args.name,
      headshotUrl: args.headshotUrl,
      primaryCrime: args.primaryCrime,
      description: args.description,
      locationLat: args.locationLat,
      locationLng: args.locationLng,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
  },
});


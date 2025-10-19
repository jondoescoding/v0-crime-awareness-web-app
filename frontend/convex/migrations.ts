import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Migration: Rename 'county' field to 'parish' in all crimeReports
 * STATUS: ✅ Completed on 2025-10-19
 */
export const renameCountyToParish = internalMutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const allReports = await ctx.db.query("crimeReports").collect();
    let updatedCount = 0;

    for (const report of allReports) {
      const reportData = report as any;
      
      // Check if the report has a 'county' field
      if ("county" in reportData && !("parish" in reportData)) {
        // Update the document with 'parish' instead of 'county'
        await ctx.db.patch(report._id, {
          parish: reportData.county as string | undefined,
        });
        
        updatedCount++;
      }
    }

    return {
      updated: updatedCount,
      total: allReports.length,
    };
  },
});

/**
 * Migration: Remove 'county' field from all crimeReports after migration
 * STATUS: ✅ Completed on 2025-10-19
 */
export const removeCountyField = internalMutation({
  args: {},
  returns: v.object({
    cleaned: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const allReports = await ctx.db.query("crimeReports").collect();
    let cleanedCount = 0;

    for (const report of allReports) {
      const reportData = report as any;
      
      // Check if the report has a 'county' field
      if ("county" in reportData) {
        // Replace the entire document without the county field
        await ctx.db.replace(report._id, {
          reportType: reportData.reportType,
          criminalId: reportData.criminalId,
          criminalName: reportData.criminalName,
          criminalHeadshot: reportData.criminalHeadshot,
          criminalCrime: reportData.criminalCrime,
          description: reportData.description,
          offenseType: reportData.offenseType,
          incidentAddress: reportData.incidentAddress,
          parish: reportData.parish,
          cityState: reportData.cityState,
          nearestIntersection: reportData.nearestIntersection,
          neighborhood: reportData.neighborhood,
          directionsToLocation: reportData.directionsToLocation,
          howHeardProgram: reportData.howHeardProgram,
          newsStoryLinks: reportData.newsStoryLinks,
          additionalInfo: reportData.additionalInfo,
          schoolRelated: reportData.schoolRelated,
          wantedFugitive: reportData.wantedFugitive,
          suspectInfo: reportData.suspectInfo,
          vehicleInfo: reportData.vehicleInfo,
          drugsInvolved: reportData.drugsInvolved,
          abuseInvolved: reportData.abuseInvolved,
          weaponsInvolved: reportData.weaponsInvolved,
          fileUploads: reportData.fileUploads,
          fileDescriptions: reportData.fileDescriptions,
          locationLat: reportData.locationLat,
          locationLng: reportData.locationLng,
          status: reportData.status,
          createdAt: reportData.createdAt,
        });
        
        cleanedCount++;
      }
    }

    return {
      cleaned: cleanedCount,
      total: allReports.length,
    };
  },
});


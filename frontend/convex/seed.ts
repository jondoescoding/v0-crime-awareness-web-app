import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed the database with criminal data from convexdata.json
 */
export const seedDatabase = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if we already have data
    const existingCriminals = await ctx.db.query("criminals").collect();
    if (existingCriminals.length > 0) {
      console.log("Database already seeded");
      return null;
    }

    const now = Date.now();

    // Criminal data from convexdata.json
    const criminalsData = [
      {
        name: "Courtney Sands",
        alias: "Joshua",
        crimes: "Murder",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-21-at-11.15.20-AM-495x400.jpeg",
        location: "Kingston Central Police"
      },
      {
        name: "Kafore Barley",
        alias: "Hunter/Sparta/CJ",
        crimes: "Shooting with Intent",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-21-at-11.15.21-AM-1-495x400.jpeg",
        location: "Clarendon Police"
      },
      {
        name: "Gaveen Hurd",
        alias: "Bones",
        crimes: "Murder",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-21-at-11.15.21-AM-495x400.jpeg",
        location: "St Mary Police"
      },
      {
        name: "Allen Gordon",
        alias: "Zoo Roy",
        crimes: "Fraudulent Conversion",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-21-at-11.15.34-AM-1-495x400.jpeg",
        location: "St James Police"
      },
      {
        name: "Omoy Largie",
        alias: "Not Nice",
        crimes: "Murder",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-07-at-3.17.40-PM-495x400.jpeg",
        location: "St James Police"
      },
      {
        name: "Shane Morgan",
        alias: "Okay",
        crimes: "Murder",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-07-at-3.17.41-PM-1-495x400.jpeg",
        location: "St James Police"
      },
      {
        name: "Stephano Johnson",
        alias: "Steph/Beggy Don/SAJ/Bowl Head",
        crimes: "Shooting with Intent",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-07-at-3.17.41-PM-495x400.jpeg",
        location: "St James Police"
      },
      {
        name: "Rasheed Thomas",
        alias: "Kobe",
        crimes: "Murder",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-30-at-9.05.19-AM-1-495x400.jpeg",
        location: "Duhaney Park Police"
      },
      {
        name: "Edward Francis",
        alias: "Eddie",
        crimes: "Murder",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-30-at-9.05.19-AM-495x400.jpeg",
        location: "Duhaney Park Police"
      },
      {
        name: "Derrick Johnson",
        alias: "Bush",
        crimes: "Murder",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-30-at-9.05.18-AM-4-495x400.jpeg",
        location: "Hunts Bay Police"
      },
      {
        name: "Rameish Griffiths",
        alias: "Nikki",
        crimes: "Wounding with Intent",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-30-at-9.05.18-AM-3-495x400.jpeg",
        location: "Duhaney Park Police"
      },
      {
        name: "Jermaine Richards",
        alias: "Reechie",
        crimes: "Murder",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-30-at-9.05.18-AM-2-495x400.jpeg",
        location: "Duhaney Park Police"
      },
      {
        name: "Christopher Duffus",
        alias: "Chippa",
        crimes: "Murder and Shooting",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-30-at-9.05.18-AM-1-495x400.jpeg",
        location: "Duhaney Park Police"
      },
      {
        name: "Courtney Ashley",
        alias: "Ashley Orlando Willliams/Bloodstain/Biggs",
        crimes: "Murder and Shooting",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-30-at-9.05.17-AM-2-495x400.jpeg",
        location: "Duhaney Park Police"
      },
      {
        name: "Conroy Forrester",
        alias: "Junior",
        crimes: "Fraudulent Conversion",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-30-at-9.05.17-AM-495x400.jpeg",
        location: "Negril Police"
      },
      {
        name: "Yanic Reid",
        alias: "Yammo",
        crimes: "Murder",
        imageurl: "https://jcf.gov.jm/wp-content/uploads/2025/01/WhatsApp-Image-2025-01-22-at-1.17.34-PM-1-1-495x400.jpeg",
        location: "Duhaney Park Police"
      }
    ];

    // Insert all criminals
    for (const criminal of criminalsData) {
      await ctx.db.insert("criminals", {
        name: criminal.name,
        headshotUrl: criminal.imageurl,
        primaryCrime: criminal.crimes,
        description: `Alias: ${criminal.alias}\nWanted by: ${criminal.location}`,
        status: "wanted",
        createdAt: now,
      });
    }

    console.log(`Database seeded successfully with ${criminalsData.length} criminals`);
    return null;
  },
});

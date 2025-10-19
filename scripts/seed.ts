import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { readFileSync } from "fs";
import { join } from "path";

const client = new ConvexHttpClient(process.env.CONVEX_URL!);
const data = JSON.parse(readFileSync(join(__dirname, "../convexdata.json"), "utf-8"));

await client.mutation(api.seed.seedCriminals, {
  criminals: data.data.criminals
});

console.log("✅ Seeded", data.data.criminals.length, "criminals");


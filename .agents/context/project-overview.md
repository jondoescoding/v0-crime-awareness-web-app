# Project Overview

## Product Snapshot
- Name: Informa App — Real-time crime awareness.
- Focus: Combine community tips, scraped offender data, activity feeds, and maps.
- End-to-end flow: Submit → Store → Surface across list, feed, map, and emergency pages.

## Experience Map
- Tip Submission anchors incoming data for both known offenders and fresh incidents.
- Criminal List stays live by pulling data from the Crime Stop scrape and tagging new arrivals.
- Activity Feed mirrors the latest submissions so users track events chronologically.
- Activity Map visualizes tips within a ~30 km radius, emphasizing nearby threats and predictions.
- Emergency Contact page closes the loop with relevant support resources.

## Data Movement
- Database stores all submissions and scraped entries to drive each page.
- Automated scraping keeps the offender baseline fresh without manual upkeep.
- Feed, list, and map read from the same data so users never wait for manual refreshes.

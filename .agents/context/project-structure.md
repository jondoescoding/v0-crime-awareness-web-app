# Project Structure

## Frontend
- Built with TypeScript and React.
- Presents five core pages: Tip Submission, Criminal List, Activity Feed, Activity Map, Emergency Contacts.
- Real-time interactions (auto-updating lists, feeds, map markers) consume shared APIs.

## Backend
- Python services orchestrate data ingestion and storage.
- Firecrawl-driven scraper pulls offender details from the target Crime Stop page.
- API surfaces submissions, offender records, and aggregated activity for the UI.

## Data Layer
- Central database stores tip submissions and scraped offender information.
- Records include offender identity, crimes, locations, timestamps, and AI predictions.
- Supports proximity sorting and “New” tagging across frontend surfaces.

## Deployment Targets
- Vercel for the frontend delivery.
- Railway for backend services.
- Convex (or equivalent) to manage real-time data sync where required.

# PRD-04: Spatial Location-Based Gas Station Search

## Overview
Implement fast spatial search functionality to find the 5 cheapest gas stations within 30km of user's current location, sorted by proximity with visual hierarchy.

## Context
Fresh Gas app (FastAPI backend + Expo mobile + React web) currently serves 224 gas stations in Jamaica from MongoDB. Need to add location-based search with optimal performance.

## Requirements

### Functional Requirements
1. **Location Acquisition**
   - Get user's GPS coordinates (lat/lon) via Expo Location API
   - Update location every 5 minutes automatically
   - Manual refresh capability
   - Handle location permissions gracefully

2. **Spatial Search Algorithm**
   - Find stations within 30km radius of user location
   - From filtered results, select 5 cheapest stations
   - Sort final results by distance (closest first)
   - Must be O(log n) performance for 224 stations

3. **Visual Hierarchy**
   - Closest station: bright color highlighting
   - Remaining 4 stations: progressively muted colors
   - Smooth opacity/alpha gradients for visual distinction

### Technical Requirements

#### Backend (FastAPI)
- New service: `backend/src/services/spatial/location_search.py`
- Use Scipy KDTree for spatial indexing
- Implement Haversine distance calculations
- New endpoint: `GET /api/v0/spatial/nearby-cheapest`
- Follow existing architecture patterns (no business logic in endpoints)

#### Mobile (Expo/React Native)
- Zustand store for user location state
- AsyncStorage for location caching
- Integration with existing fuel-prices feature
- TanStack Query for API calls with 5min staleTime

#### Database Integration
- Use existing MongoDB gas station data
- Leverage existing lat/lon coordinates from enrichment pipeline
- No schema changes required

### Implementation Details

#### Spatial Algorithm
```python
# Core implementation using Scipy KDTree
import numpy as np
from scipy.spatial import KDTree

def build_station_index(stations):
    latlon_array = np.array([[s['latitude'], s['longitude']] for s in stations])
    return KDTree(latlon_array), stations

def find_nearest_cheapest_stations(user_lat, user_lon, stations_tree, stations, radius_km=30, k=5):
    # 1. Spatial filtering with KDTree
    candidate_indices = stations_tree.query_ball_point([user_lat, user_lon], r=radius_km/111.0)

    # 2. Distance validation + price extraction
    candidates = []
    for idx in candidate_indices:
        station = stations[idx]
        distance = haversine_distance(user_lat, user_lon, station['latitude'], station['longitude'])
        if distance <= radius_km:
            cheapest_price = min([fuel['price'] for fuel in station['fuel_types']])
            candidates.append({
                'station': station,
                'distance': distance,
                'cheapest_price': cheapest_price
            })

    # 3. Sort by price first, then distance
    candidates.sort(key=lambda x: (x['cheapest_price'], x['distance']))
    return candidates[:k]
```

#### Mobile Location Management
```typescript
// Zustand store extension
interface LocationState {
  userLocation: { lat: number; lon: number; timestamp: number } | null;
  setUserLocation: (location: { lat: number; lon: number }) => void;
  isLocationStale: () => boolean;
}

// Update strategy
const LOCATION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
```

#### Color Hierarchy
```typescript
const getStationColor = (index: number, total: number) => {
  if (index === 0) return '#FF6B35'; // Bright primary for closest
  const opacity = 1 - (index / (total - 1)) * 0.6; // Fade from 1.0 to 0.4
  return `rgba(176, 176, 176, ${opacity})`; // Muted gray with decreasing opacity
};
```

## File Structure
```
backend/src/
├── services/spatial/
│   ├── __init__.py
│   ├── location_search.py
│   └── distance_utils.py
├── api/spatial/
│   └── location.py
└── tests/spatial/
    └── test_location_search.py

apps/mobile/src/features/
├── location/
│   ├── store.ts
│   ├── hooks.ts
│   └── api.ts
└── fuel-prices/
    └── spatial-list.tsx (new component)
```

## Dependencies
- Backend: scipy (add to pyproject.toml)
- Mobile: expo-location (likely already included)

## Success Criteria
1. Sub-100ms response time for spatial queries
2. Accurate distance calculations (±50m precision)
3. Smooth location updates without UI jarring
4. Clear visual hierarchy in station list
5. Graceful degradation when location unavailable

## Notes
- Leverage existing enrichment pipeline for coordinate data
- Follow monorepo patterns (uv for backend, npm for mobile)
- Maintain strict typing throughout
- Write tests before implementation

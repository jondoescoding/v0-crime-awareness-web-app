"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Create a loading component for the map
const MapLoading = () => (
  <div className="flex-1 relative bg-gray-100 flex items-center justify-center">
    <div className="text-center space-y-4 p-8">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Loading Interactive Map</h3>
        <p className="text-sm text-gray-600">
          Initializing crime awareness map...
        </p>
      </div>
    </div>
  </div>
);

// Dynamically import the map component with no SSR
const DynamicMapComponent = dynamic(
  () => import('../components/interactive-crime-map'),
  {
    ssr: false,
    loading: () => <MapLoading />
  }
);


export default function DynamicMap() {
  return (
    <Suspense fallback={<MapLoading />}>
      <DynamicMapComponent />
    </Suspense>
  );
}

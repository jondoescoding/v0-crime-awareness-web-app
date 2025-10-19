"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, Tooltip } from "react-leaflet";
import L from "leaflet";
import { 
  AlertTriangle, 
  Shield, 
  Flame, 
  MapPin, 
  Plus, 
  Filter,
  Bell,
  Users,
  Activity,
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import dynamic from 'next/dynamic';

// Dynamically import analytics to avoid SSR issues
const Analytics = dynamic(() => import('./simple-analytics'), {
  ssr: false,
  loading: () => <div className="p-6 bg-white"><div className="animate-pulse">Loading analytics...</div></div>
});

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Types
interface CrimeReport {
  id: string;
  type: 'theft' | 'assault' | 'vandalism' | 'burglary' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: [number, number];
  description: string;
  timestamp: Date;
  status: 'active' | 'investigating' | 'resolved';
  reporter?: string;
}

interface EmergencyService {
  id: string;
  type: 'police' | 'fire' | 'medical';
  name: string;
  location: [number, number];
  status: 'available' | 'busy' | 'offline';
  contact: string;
}

interface AlertZone {
  id: string;
  name: string;
  center: [number, number];
  radius: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  active: boolean;
}

// Custom marker icons
const createCustomIcon = (color: string, icon: any) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${icon}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const crimeIcon = createCustomIcon('#dc2626', '🚨');
const policeIcon = createCustomIcon('#2563eb', '👮');
const fireIcon = createCustomIcon('#dc2626', '🚒');
const alertIcon = createCustomIcon('#f59e0b', '⚠️');

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Main Map Component
export default function InteractiveCrimeMap() {
  const [crimes, setCrimes] = useState<CrimeReport[]>([
    {
      id: '1',
      type: 'theft',
      severity: 'medium',
      location: [18.0019, -76.7942],
      description: 'Car break-in reported in downtown Kingston',
      timestamp: new Date(),
      status: 'active',
      reporter: 'John Brown'
    },
    {
      id: '2',
      type: 'assault',
      severity: 'high',
      location: [18.0123, -76.7891],
      description: 'Physical altercation in progress near Half Way Tree',
      timestamp: new Date(Date.now() - 3600000),
      status: 'investigating',
      reporter: 'Jane Williams'
    },
    {
      id: '3',
      type: 'vandalism',
      severity: 'low',
      location: [17.9961, -76.9547],
      description: 'Graffiti reported in Spanish Town',
      timestamp: new Date(Date.now() - 7200000),
      status: 'active',
      reporter: 'Mike Johnson'
    }
  ]);

  const [emergencyServices, setEmergencyServices] = useState<EmergencyService[]>([
    {
      id: '1',
      type: 'police',
      name: 'Jamaica Police Station',
      location: [18.0019, -76.7942],
      status: 'available',
      contact: '119'
    },
    {
      id: '2',
      type: 'police',
      name: 'Half Way Tree Police Station',
      location: [18.0123, -76.7891],
      status: 'busy',
      contact: '110'
    },
    {
      id: '3',
      type: 'police',
      name: 'Spanish Town Police Station',
      location: [17.9961, -76.9547],
      status: 'available',
      contact: '119'
    },
    {
      id: '4',
      type: 'fire',
      name: 'Jamaica Fire Station',
      location: [18.0019, -76.7942],
      status: 'available',
      contact: '110'
    },
    {
      id: '5',
      type: 'fire',
      name: 'Kingston Fire Station',
      location: [17.9970, -76.7936],
      status: 'available',
      contact: '110'
    }
  ]);

  const [alertZones, setAlertZones] = useState<AlertZone[]>([
    {
      id: '1',
      name: 'Downtown Kingston High Crime Area',
      center: [18.0019, -76.7942],
      radius: 800,
      level: 'high',
      description: 'Increased criminal activity reported in downtown Kingston',
      active: true
    },
    {
      id: '2',
      name: 'Spanish Town Alert Zone',
      center: [17.9961, -76.9547],
      radius: 600,
      level: 'medium',
      description: 'Moderate crime activity in Spanish Town area',
      active: true
    }
  ]);

  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [filters, setFilters] = useState({
    showCrimes: true,
    showServices: true,
    showAlerts: true,
    showCrimeRadius: true,
    crimeSeverity: 'all' as 'all' | 'low' | 'medium' | 'high' | 'critical'
  });

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setShowReportForm(true);
  }, []);

  const handleCrimeReport = (reportData: Omit<CrimeReport, 'id' | 'timestamp'>) => {
    const newCrime: CrimeReport = {
      ...reportData,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setCrimes(prev => [...prev, newCrime]);
    setShowReportForm(false);
    setSelectedLocation(null);
  };

  const getCrimeColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'low': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getCrimeRadiusColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Control Panel */}
        <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Crime Map Dashboard</h1>
        
        {/* Filters */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showCrimes}
                onChange={(e) => setFilters(prev => ({ ...prev, showCrimes: e.target.checked }))}
                className="mr-2"
              />
              Show Crimes
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showServices}
                onChange={(e) => setFilters(prev => ({ ...prev, showServices: e.target.checked }))}
                className="mr-2"
              />
              Show Emergency Services
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showAlerts}
                onChange={(e) => setFilters(prev => ({ ...prev, showAlerts: e.target.checked }))}
                className="mr-2"
              />
              Show Alert Zones
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showCrimeRadius}
                onChange={(e) => setFilters(prev => ({ ...prev, showCrimeRadius: e.target.checked }))}
                className="mr-2"
              />
              Show Crime Radius (30km)
            </label>
            <div>
              <label className="block text-sm font-medium mb-1">Crime Severity:</label>
              <select
                value={filters.crimeSeverity}
                onChange={(e) => setFilters(prev => ({ ...prev, crimeSeverity: e.target.value as any }))}
                className="w-full p-2 border rounded"
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 p-3 rounded">
              <div className="text-2xl font-bold text-red-600">
                {crimes.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-red-600">Active Crimes</div>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {emergencyServices.filter(s => s.status === 'available').length}
              </div>
              <div className="text-sm text-blue-600">Available Units</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-2xl font-bold text-yellow-600">
                {alertZones.filter(z => z.active).length}
              </div>
              <div className="text-sm text-yellow-600">Alert Zones</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-2xl font-bold text-green-600">
                {crimes.filter(c => c.status === 'resolved').length}
              </div>
              <div className="text-sm text-green-600">Resolved</div>
            </div>
          </div>
        </div>

        {/* Recent Crimes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Recent Crimes
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {crimes.slice(0, 5).map(crime => (
              <div key={crime.id} className="p-3 bg-gray-50 rounded border-l-4" 
                   style={{ borderLeftColor: getCrimeColor(crime.severity) }}>
                <div className="font-medium capitalize">{crime.type}</div>
                <div className="text-sm text-gray-600">{crime.description}</div>
                <div className="text-xs text-gray-500">
                  {format(crime.timestamp, 'MMM dd, HH:mm')} • {crime.severity}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Legend
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span>🚨 Crime Reports</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <span>👮 Police Stations</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span>🚒 Fire Stations</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
              <span>⚠️ Alert Zones</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-2 border-2 border-gray-500"></div>
              <span>Crime Radius (30km )</span>
            </div>
          </div>
        </div>

        {/* Analytics Toggle */}
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 flex items-center justify-center mb-4"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          {showAnalytics ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
        </button>

        {/* Report Button */}
        <button
          onClick={() => setShowReportForm(true)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Report Crime
        </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
        <MapContainer
          center={[18.0019, -76.7942]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Crime Markers */}
          {filters.showCrimes && crimes
            .filter(crime => filters.crimeSeverity === 'all' || crime.severity === filters.crimeSeverity)
            .map(crime => (
            <Marker
              key={crime.id}
              position={crime.location}
              icon={crimeIcon}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-center">
                  <div className="font-bold text-sm capitalize text-red-600">{crime.type}</div>
                  <div className="text-xs text-gray-600">{crime.description}</div>
                  <div className="text-xs">
                    <span className="font-medium" style={{ color: getCrimeColor(crime.severity) }}>
                      {crime.severity}
                    </span> • {crime.status}
                  </div>
                </div>
              </Tooltip>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold capitalize text-red-600">{crime.type}</h3>
                  <p className="text-sm">{crime.description}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    <div>Severity: <span className="font-medium" style={{ color: getCrimeColor(crime.severity) }}>
                      {crime.severity}
                    </span></div>
                    <div>Status: {crime.status}</div>
                    <div>Time: {format(crime.timestamp, 'MMM dd, HH:mm')}</div>
                    {crime.reporter && <div>Reporter: {crime.reporter}</div>}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Emergency Services */}
          {filters.showServices && emergencyServices.map(service => (
            <Marker
              key={service.id}
              position={service.location}
              icon={service.type === 'police' ? policeIcon : fireIcon}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-center">
                  <div className="font-bold text-sm">{service.name}</div>
                  <div className="text-xs">
                    Status: <span className={`font-medium ${
                      service.status === 'available' ? 'text-green-600' : 
                      service.status === 'busy' ? 'text-yellow-600' : 'text-red-600'
                    }`}>{service.status}</span>
                  </div>
                  <div className="text-xs text-gray-600">{service.contact}</div>
                </div>
              </Tooltip>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-blue-600">{service.name}</h3>
                  <p className="text-sm">Type: {service.type}</p>
                  <p className="text-sm">Status: <span className={`font-medium ${
                    service.status === 'available' ? 'text-green-600' : 
                    service.status === 'busy' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{service.status}</span></p>
                  <p className="text-sm">Contact: {service.contact}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Crime Radius Circles (30km) */}
          {filters.showCrimeRadius && crimes
            .filter(crime => crime.status === 'active')
            .map(crime => (
            <Circle
              key={`radius-${crime.id}`}
              center={crime.location}
              radius={100} // 0.1km in meters
              pathOptions={{
                color: getCrimeRadiusColor(crime.severity),
                fillColor: getCrimeRadiusColor(crime.severity),
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          ))}

          {/* Alert Zones */}
          {filters.showAlerts && alertZones.filter(zone => zone.active).map(zone => (
            <Circle
              key={zone.id}
              center={zone.center}
              radius={zone.radius}
              pathOptions={{
                color: getAlertColor(zone.level),
                fillColor: getAlertColor(zone.level),
                fillOpacity: 0.2,
                weight: 2
              }}
            />
          ))}
        </MapContainer>

        {/* Crime Report Form Modal */}
        {showReportForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Report a Crime</h2>
              <CrimeReportForm
                location={selectedLocation}
                onSubmit={handleCrimeReport}
                onCancel={() => {
                  setShowReportForm(false);
                  setSelectedLocation(null);
                }}
              />
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="h-96 overflow-y-auto border-t">
          <Analytics 
            crimes={crimes} 
            emergencyServices={emergencyServices} 
            alertZones={alertZones} 
          />
        </div>
      )}
    </div>
  );
}

// Crime Report Form Component
function CrimeReportForm({ 
  location, 
  onSubmit, 
  onCancel 
}: { 
  location: [number, number] | null;
  onSubmit: (data: Omit<CrimeReport, 'id' | 'timestamp'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'theft' as CrimeReport['type'],
    severity: 'medium' as CrimeReport['severity'],
    description: '',
    reporter: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location) {
      onSubmit({
        ...formData,
        location,
        status: 'active'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Crime Type:</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
          className="w-full p-2 border rounded"
          required
        >
          <option value="theft">Theft</option>
          <option value="assault">Assault</option>
          <option value="vandalism">Vandalism</option>
          <option value="burglary">Burglary</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Severity:</label>
        <select
          value={formData.severity}
          onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
          className="w-full p-2 border rounded"
          required
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description:</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full p-2 border rounded h-20"
          placeholder="Describe what happened..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Your Name (Optional):</label>
        <input
          type="text"
          value={formData.reporter}
          onChange={(e) => setFormData(prev => ({ ...prev, reporter: e.target.value }))}
          className="w-full p-2 border rounded"
          placeholder="Enter your name"
        />
      </div>

      {location && (
        <div className="text-sm text-gray-600">
          Location: {location[0].toFixed(4)}, {location[1].toFixed(4)}
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Submit Report
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

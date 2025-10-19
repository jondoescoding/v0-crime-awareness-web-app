"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { geocodeFullAddress } from "@/lib/geocoding";

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
  _id: string;
  reportType: 'existing_criminal' | 'new_crime';
  offenseType: string;
  description: string;
  cityState: string;
  incidentAddress?: string;
  neighborhood?: string;
  county?: string;
  locationLat?: number;
  locationLng?: number;
  status: string;
  createdAt: number;
  criminalName?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  drugsInvolved?: boolean;
  weaponsInvolved?: boolean;
  abuseInvolved?: boolean;
}

interface MapCrimeMarker {
  id: string;
  location: [number, number];
  offenseType: string;
  description: string;
  cityState: string;
  status: string;
  createdAt: number;
  criminalName?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface EmergencyService {
  id: string;
  type: 'police' | 'fire' | 'medical';
  name: string;
  location: [number, number];
  status: 'available' | 'busy' | 'offline';
  contact: string;
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
const fireIcon = createCustomIcon('#ff4000', '🚒');
const hospitalIcon = createCustomIcon('#10b981', '🏥');

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Hardcoded Emergency Services for Jamaica
const JAMAICA_EMERGENCY_SERVICES: EmergencyService[] = [
  // Police Stations - Kingston & St. Andrew
  { id: 'ps1', type: 'police', name: 'Kingston Central Police Station', location: [17.9714, -76.7932], status: 'available', contact: '119' },
  { id: 'ps2', type: 'police', name: 'Half Way Tree Police Station', location: [18.0123, -76.7967], status: 'available', contact: '119' },
  { id: 'ps3', type: 'police', name: 'Cross Roads Police Station', location: [18.0019, -76.7942], status: 'available', contact: '119' },
  { id: 'ps4', type: 'police', name: 'Constant Spring Police Station', location: [18.0297, -76.7984], status: 'available', contact: '119' },
  { id: 'ps5', type: 'police', name: 'Matilda\'s Corner Police Station', location: [18.0389, -76.8061], status: 'available', contact: '119' },
  { id: 'ps6', type: 'police', name: 'Harbour View Police Station', location: [17.9608, -76.7378], status: 'available', contact: '119' },
  { id: 'ps7', type: 'police', name: 'Port Royal Police Station', location: [17.9369, -76.8419], status: 'available', contact: '119' },
  
  // Police Stations - St. Catherine
  { id: 'ps8', type: 'police', name: 'Spanish Town Police Station', location: [17.9961, -76.9547], status: 'available', contact: '119' },
  { id: 'ps9', type: 'police', name: 'Portmore Police Station', location: [17.9557, -76.8815], status: 'available', contact: '119' },
  { id: 'ps10', type: 'police', name: 'Old Harbour Police Station', location: [17.9431, -77.1089], status: 'available', contact: '119' },
  { id: 'ps11', type: 'police', name: 'Linstead Police Station', location: [18.1350, -77.0322], status: 'available', contact: '119' },
  
  // Police Stations - St. James
  { id: 'ps12', type: 'police', name: 'Montego Bay Police Station', location: [18.4762, -77.8939], status: 'available', contact: '119' },
  { id: 'ps13', type: 'police', name: 'Anchovy Police Station', location: [18.4086, -77.9633], status: 'available', contact: '119' },
  { id: 'ps14', type: 'police', name: 'Cambridge Police Station', location: [18.3800, -77.8200], status: 'available', contact: '119' },
  
  // Police Stations - St. Ann
  { id: 'ps15', type: 'police', name: 'Ocho Rios Police Station', location: [18.4078, -77.1032], status: 'available', contact: '119' },
  { id: 'ps16', type: 'police', name: 'St. Ann\'s Bay Police Station', location: [18.4378, -77.2011], status: 'available', contact: '119' },
  { id: 'ps17', type: 'police', name: 'Brown\'s Town Police Station', location: [18.3944, -77.3636], status: 'available', contact: '119' },
  
  // Police Stations - Manchester
  { id: 'ps18', type: 'police', name: 'Mandeville Police Station', location: [18.0418, -77.5050], status: 'available', contact: '119' },
  { id: 'ps19', type: 'police', name: 'Christiana Police Station', location: [18.2186, -77.4144], status: 'available', contact: '119' },
  
  // Police Stations - Clarendon
  { id: 'ps20', type: 'police', name: 'May Pen Police Station', location: [17.9644, -77.2447], status: 'available', contact: '119' },
  { id: 'ps21', type: 'police', name: 'Frankfield Police Station', location: [18.0503, -77.3231], status: 'available', contact: '119' },
  
  // Police Stations - Portland
  { id: 'ps22', type: 'police', name: 'Port Antonio Police Station', location: [18.1778, -76.4506], status: 'available', contact: '119' },
  { id: 'ps23', type: 'police', name: 'Buff Bay Police Station', location: [18.1850, -76.6742], status: 'available', contact: '119' },
  
  // Police Stations - St. Thomas
  { id: 'ps24', type: 'police', name: 'Morant Bay Police Station', location: [17.8814, -76.4092], status: 'available', contact: '119' },
  { id: 'ps25', type: 'police', name: 'Yallahs Police Station', location: [17.8717, -76.5667], status: 'available', contact: '119' },
  
  // Police Stations - Trelawny
  { id: 'ps26', type: 'police', name: 'Falmouth Police Station', location: [18.4925, -77.6542], status: 'available', contact: '119' },
  { id: 'ps27', type: 'police', name: 'Clark\'s Town Police Station', location: [18.4372, -77.5947], status: 'available', contact: '119' },
  
  // Police Stations - Westmoreland
  { id: 'ps28', type: 'police', name: 'Savanna-la-Mar Police Station', location: [18.2189, -78.1322], status: 'available', contact: '119' },
  { id: 'ps29', type: 'police', name: 'Negril Police Station', location: [18.2678, -78.3495], status: 'available', contact: '119' },
  
  // Police Stations - Hanover
  { id: 'ps30', type: 'police', name: 'Lucea Police Station', location: [18.4508, -78.1736], status: 'available', contact: '119' },
  
  // Police Stations - St. Elizabeth
  { id: 'ps31', type: 'police', name: 'Black River Police Station', location: [18.0261, -77.8497], status: 'available', contact: '119' },
  { id: 'ps32', type: 'police', name: 'Santa Cruz Police Station', location: [18.0836, -77.9378], status: 'available', contact: '119' },
  
  // Police Stations - St. Mary
  { id: 'ps33', type: 'police', name: 'Port Maria Police Station', location: [18.3681, -76.8900], status: 'available', contact: '119' },
  { id: 'ps34', type: 'police', name: 'Annotto Bay Police Station', location: [18.2725, -76.7692], status: 'available', contact: '119' },

  // Fire Stations - Kingston & St. Andrew
  { id: 'fs1', type: 'fire', name: 'York Park Fire Station', location: [17.9970, -76.7936], status: 'available', contact: '110' },
  { id: 'fs2', type: 'fire', name: 'Half Way Tree Fire Station', location: [18.0131, -76.7975], status: 'available', contact: '110' },
  { id: 'fs3', type: 'fire', name: 'Rollington Town Fire Station', location: [17.9883, -76.7744], status: 'available', contact: '110' },
  { id: 'fs4', type: 'fire', name: 'Stony Hill Fire Station', location: [18.0764, -76.8142], status: 'available', contact: '110' },
  
  // Fire Stations - St. Catherine
  { id: 'fs5', type: 'fire', name: 'Spanish Town Fire Station', location: [17.9939, -76.9561], status: 'available', contact: '110' },
  { id: 'fs6', type: 'fire', name: 'Portmore Fire Station', location: [17.9550, -76.8869], status: 'available', contact: '110' },
  { id: 'fs7', type: 'fire', name: 'Old Harbour Fire Station', location: [17.9425, -77.1075], status: 'available', contact: '110' },
  
  // Fire Stations - St. James
  { id: 'fs8', type: 'fire', name: 'Montego Bay Fire Station', location: [18.4742, -77.8967], status: 'available', contact: '110' },
  { id: 'fs9', type: 'fire', name: 'Ironshore Fire Station', location: [18.4583, -77.8528], status: 'available', contact: '110' },
  
  // Fire Stations - St. Ann
  { id: 'fs10', type: 'fire', name: 'Ocho Rios Fire Station', location: [18.4069, -77.1044], status: 'available', contact: '110' },
  { id: 'fs11', type: 'fire', name: 'St. Ann\'s Bay Fire Station', location: [18.4367, -77.2019], status: 'available', contact: '110' },
  
  // Fire Stations - Manchester
  { id: 'fs12', type: 'fire', name: 'Mandeville Fire Station', location: [18.0406, -77.5042], status: 'available', contact: '110' },
  
  // Fire Stations - Clarendon
  { id: 'fs13', type: 'fire', name: 'May Pen Fire Station', location: [17.9656, -77.2433], status: 'available', contact: '110' },
  
  // Fire Stations - Portland
  { id: 'fs14', type: 'fire', name: 'Port Antonio Fire Station', location: [18.1789, -76.4500], status: 'available', contact: '110' },
  
  // Fire Stations - St. Thomas
  { id: 'fs15', type: 'fire', name: 'Morant Bay Fire Station', location: [17.8822, -76.4086], status: 'available', contact: '110' },
  
  // Fire Stations - Trelawny
  { id: 'fs16', type: 'fire', name: 'Falmouth Fire Station', location: [18.4917, -77.6550], status: 'available', contact: '110' },
  
  // Fire Stations - Westmoreland
  { id: 'fs17', type: 'fire', name: 'Savanna-la-Mar Fire Station', location: [18.2197, -78.1314], status: 'available', contact: '110' },
  { id: 'fs18', type: 'fire', name: 'Negril Fire Station', location: [18.2686, -78.3503], status: 'available', contact: '110' },
  
  // Fire Stations - Hanover
  { id: 'fs19', type: 'fire', name: 'Lucea Fire Station', location: [18.4500, -78.1728], status: 'available', contact: '110' },
  
  // Fire Stations - St. Elizabeth
  { id: 'fs20', type: 'fire', name: 'Black River Fire Station', location: [18.0269, -77.8489], status: 'available', contact: '110' },
  
  // Fire Stations - St. Mary
  { id: 'fs21', type: 'fire', name: 'Port Maria Fire Station', location: [18.3689, -76.8908], status: 'available', contact: '110' },

  // Hospitals - Kingston & St. Andrew
  { id: 'h1', type: 'medical', name: 'Kingston Public Hospital', location: [17.9686, -76.7856], status: 'available', contact: '110' },
  { id: 'h2', type: 'medical', name: 'University Hospital of the West Indies', location: [18.0047, -76.7472], status: 'available', contact: '927-1620' },
  { id: 'h3', type: 'medical', name: 'Bustamante Hospital for Children', location: [17.9697, -76.7881], status: 'available', contact: '948-3311' },
  { id: 'h4', type: 'medical', name: 'National Chest Hospital', location: [17.9706, -76.7878], status: 'available', contact: '948-5601' },
  { id: 'h5', type: 'medical', name: 'Sir John Golding Rehabilitation Centre', location: [18.0064, -76.7464], status: 'available', contact: '927-1680' },
  { id: 'h6', type: 'medical', name: 'Andrews Memorial Hospital', location: [18.0156, -76.7917], status: 'available', contact: '926-7401' },
  { id: 'h7', type: 'medical', name: 'Nuttall Memorial Hospital', location: [18.0153, -76.7881], status: 'available', contact: '926-2139' },
  { id: 'h8', type: 'medical', name: 'Medical Associates Hospital', location: [18.0108, -76.7950], status: 'available', contact: '926-1400' },
  { id: 'h9', type: 'medical', name: 'Tony Thwaites Wing (UWI)', location: [18.0042, -76.7456], status: 'available', contact: '927-1214' },
  
  // Hospitals - St. Catherine
  { id: 'h10', type: 'medical', name: 'Spanish Town Hospital', location: [17.9919, -76.9539], status: 'available', contact: '984-3331' },
  { id: 'h11', type: 'medical', name: 'St. Jago Park Hospital', location: [17.9947, -76.9503], status: 'available', contact: '749-6841' },
  { id: 'h12', type: 'medical', name: 'Linstead Hospital', location: [18.1361, -77.0317], status: 'available', contact: '985-2221' },
  { id: 'h13', type: 'medical', name: 'May Pen Hospital', location: [17.9658, -77.2456], status: 'available', contact: '986-2252' },
  
  // Hospitals - St. James
  { id: 'h14', type: 'medical', name: 'Cornwall Regional Hospital', location: [18.4717, -77.9189], status: 'available', contact: '952-5100' },
  { id: 'h15', type: 'medical', name: 'Hospiten Montego Bay', location: [18.4856, -77.9133], status: 'available', contact: '953-3649' },
  { id: 'h16', type: 'medical', name: 'Fairview Medical Centre', location: [18.4797, -77.8942], status: 'available', contact: '952-9450' },
  
  // Hospitals - St. Ann
  { id: 'h17', type: 'medical', name: 'St. Ann\'s Bay Regional Hospital', location: [18.4372, -77.2006], status: 'available', contact: '972-2272' },
  { id: 'h18', type: 'medical', name: 'Port Antonio Hospital', location: [18.1792, -76.4497], status: 'available', contact: '993-2646' },
  
  // Hospitals - Manchester
  { id: 'h19', type: 'medical', name: 'Mandeville Regional Hospital', location: [18.0425, -77.5033], status: 'available', contact: '962-2067' },
  { id: 'h20', type: 'medical', name: 'Hargreaves Memorial Hospital', location: [18.0428, -77.5025], status: 'available', contact: '962-2243' },
  
  // Hospitals - Clarendon
  { id: 'h21', type: 'medical', name: 'Lionel Town Hospital', location: [17.8242, -77.2361], status: 'available', contact: '986-2122' },
  { id: 'h22', type: 'medical', name: 'Chapelton Hospital', location: [18.1167, -77.2167], status: 'available', contact: '986-3110' },
  
  // Hospitals - Portland
  { id: 'h23', type: 'medical', name: 'Buff Bay Hospital', location: [18.1861, -76.6747], status: 'available', contact: '996-1027' },
  
  // Hospitals - St. Thomas
  { id: 'h24', type: 'medical', name: 'Princess Margaret Hospital', location: [17.8828, -76.4083], status: 'available', contact: '982-2126' },
  
  // Hospitals - Trelawny
  { id: 'h25', type: 'medical', name: 'Falmouth Hospital', location: [18.4933, -77.6536], status: 'available', contact: '954-3326' },
  
  // Hospitals - Westmoreland
  { id: 'h26', type: 'medical', name: 'Savanna-la-Mar Hospital', location: [18.2203, -78.1328], status: 'available', contact: '955-2532' },
  { id: 'h27', type: 'medical', name: 'Negril Health Centre', location: [18.2672, -78.3511], status: 'available', contact: '957-4926' },
  
  // Hospitals - Hanover
  { id: 'h28', type: 'medical', name: 'Noel Holmes Hospital', location: [18.4514, -78.1731], status: 'available', contact: '956-2233' },
  
  // Hospitals - St. Elizabeth
  { id: 'h29', type: 'medical', name: 'Black River Hospital', location: [18.0267, -77.8492], status: 'available', contact: '965-2212' },
  { id: 'h30', type: 'medical', name: 'Lacovia Hospital', location: [18.0997, -77.8072], status: 'available', contact: '966-2326' },
  
  // Hospitals - St. Mary
  { id: 'h31', type: 'medical', name: 'Port Maria Hospital', location: [18.3697, -76.8889], status: 'available', contact: '994-2221' },
  { id: 'h32', type: 'medical', name: 'Annotto Bay Hospital', location: [18.2731, -76.7686], status: 'available', contact: '996-2223' },
];

// Main Map Component
export default function InteractiveCrimeMap() {
  // Fetch crime reports from Convex
  const crimeReports = useQuery(api.crimeReports.list, {});
  
  const [crimeMarkers, setCrimeMarkers] = useState<MapCrimeMarker[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [filters, setFilters] = useState({
    showCrimes: true,
    showPolice: true,
    showFire: true,
    showHospitals: true,
    showCrimeRadius: true,
    crimeSeverity: 'all' as 'all' | 'low' | 'medium' | 'high' | 'critical'
  });

  // Process crime reports and geocode addresses
  useEffect(() => {
    if (!crimeReports) return;

    const processReports = async () => {
      setIsGeocoding(true);
      const markers: MapCrimeMarker[] = [];

      for (const report of crimeReports) {
        let lat = report.locationLat;
        let lng = report.locationLng;

        // If coordinates don't exist, geocode the address
        if (!lat || !lng) {
          const geocodeResult = await geocodeFullAddress({
            incidentAddress: report.incidentAddress,
            neighborhood: report.neighborhood,
            cityState: report.cityState,
            //county: report.county,
          });

          if (geocodeResult) {
            lat = geocodeResult.lat;
            lng = geocodeResult.lng;
          }
        }

        // Only add markers that have valid coordinates
        if (lat && lng) {
          // Determine severity based on offense type and flags
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
          
          if (report.weaponsInvolved || report.offenseType.toLowerCase().includes('murder') || 
              report.offenseType.toLowerCase().includes('assault')) {
            severity = 'critical';
          } else if (report.offenseType.toLowerCase().includes('robbery') || 
                     report.offenseType.toLowerCase().includes('burglary') ||
                     report.drugsInvolved) {
            severity = 'high';
          } else if (report.offenseType.toLowerCase().includes('theft') || 
                     report.offenseType.toLowerCase().includes('vandalism')) {
            severity = 'low';
          }

          markers.push({
            id: report._id,
            location: [lat, lng],
            offenseType: report.offenseType,
            description: report.description,
            cityState: report.cityState,
            status: report.status,
            createdAt: report.createdAt,
            criminalName: report.criminalName,
            severity,
          });
        }
      }

      setCrimeMarkers(markers);
      setIsGeocoding(false);
    };

    processReports();
  }, [crimeReports]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setShowReportForm(true);
  }, []);

  const getCrimeColor = (severity: string) => {
    switch (severity) {
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
                checked={filters.showPolice}
                onChange={(e) => setFilters(prev => ({ ...prev, showPolice: e.target.checked }))}
                className="mr-2"
              />
              👮 Show Police Stations
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showFire}
                onChange={(e) => setFilters(prev => ({ ...prev, showFire: e.target.checked }))}
                className="mr-2"
              />
              🚒 Show Fire Stations
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showHospitals}
                onChange={(e) => setFilters(prev => ({ ...prev, showHospitals: e.target.checked }))}
                className="mr-2"
              />
              🏥 Show Hospitals
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
                {crimeMarkers.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-red-600">Active Crimes</div>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {JAMAICA_EMERGENCY_SERVICES.filter(s => s.type === 'police').length}
              </div>
              <div className="text-sm text-blue-600">Police Stations</div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {JAMAICA_EMERGENCY_SERVICES.filter(s => s.type === 'fire').length}
              </div>
              <div className="text-sm text-orange-600">Fire Stations</div>
            </div>
            <div className="bg-emerald-50 p-3 rounded">
              <div className="text-2xl font-bold text-emerald-600">
                {JAMAICA_EMERGENCY_SERVICES.filter(s => s.type === 'medical').length}
              </div>
              <div className="text-sm text-emerald-600">Hospitals</div>
            </div>
          </div>
          {isGeocoding && (
            <div className="mt-2 text-sm text-gray-500 italic">
              Loading locations...
            </div>
          )}
        </div>

        {/* Recent Crimes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Recent Crimes
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {crimeMarkers.slice(0, 5).map(crime => (
              <div key={crime.id} className="p-3 bg-gray-50 rounded border-l-4" 
                   style={{ borderLeftColor: getCrimeColor(crime.severity) }}>
                <div className="font-medium capitalize">{crime.offenseType}</div>
                <div className="text-sm text-gray-600">{crime.description.substring(0, 60)}...</div>
                <div className="text-xs text-gray-500">
                  {format(new Date(crime.createdAt), 'MMM dd, HH:mm')} • {crime.severity}
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
              <div className="w-4 h-4 bg-emerald-500 rounded-full mr-2"></div>
              <span>🏥 Hospitals</span>
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

        {/* Report Button - Use main report form */}
        <button
          onClick={() => window.location.href = '/'}
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
          {filters.showCrimes && crimeMarkers
            .filter(crime => filters.crimeSeverity === 'all' || crime.severity === filters.crimeSeverity)
            .map(crime => (
            <Marker
              key={crime.id}
              position={crime.location}
              icon={crimeIcon}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-center">
                  <div className="font-bold text-sm capitalize text-red-600">{crime.offenseType}</div>
                  <div className="text-xs text-gray-600">{crime.description.substring(0, 50)}...</div>
                  <div className="text-xs">
                    <span className="font-medium" style={{ color: getCrimeColor(crime.severity) }}>
                      {crime.severity}
                    </span> • {crime.status}
                  </div>
                </div>
              </Tooltip>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold capitalize text-red-600">{crime.offenseType}</h3>
                  {crime.criminalName && <p className="text-sm font-medium">Suspect: {crime.criminalName}</p>}
                  <p className="text-sm">{crime.description}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    <div>Severity: <span className="font-medium" style={{ color: getCrimeColor(crime.severity) }}>
                      {crime.severity}
                    </span></div>
                    <div>Status: {crime.status}</div>
                    <div>Location: {crime.cityState}</div>
                    <div>Time: {format(new Date(crime.createdAt), 'MMM dd, HH:mm')}</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Police Stations */}
          {filters.showPolice && JAMAICA_EMERGENCY_SERVICES
            .filter(service => service.type === 'police')
            .map(service => (
            <Marker
              key={service.id}
              position={service.location}
              icon={policeIcon}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-center">
                  <div className="font-bold text-sm">{service.name}</div>
                  <div className="text-xs text-gray-600">📞 {service.contact}</div>
                </div>
              </Tooltip>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-blue-600">👮 {service.name}</h3>
                  <p className="text-sm">Type: Police Station</p>
                  <p className="text-sm">Emergency Contact: <span className="font-medium text-blue-600">{service.contact}</span></p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Fire Stations */}
          {filters.showFire && JAMAICA_EMERGENCY_SERVICES
            .filter(service => service.type === 'fire')
            .map(service => (
            <Marker
              key={service.id}
              position={service.location}
              icon={fireIcon}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-center">
                  <div className="font-bold text-sm">{service.name}</div>
                  <div className="text-xs text-gray-600">📞 {service.contact}</div>
                </div>
              </Tooltip>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-red-600">🚒 {service.name}</h3>
                  <p className="text-sm">Type: Fire Station</p>
                  <p className="text-sm">Emergency Contact: <span className="font-medium text-red-600">{service.contact}</span></p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Hospitals */}
          {filters.showHospitals && JAMAICA_EMERGENCY_SERVICES
            .filter(service => service.type === 'medical')
            .map(service => (
            <Marker
              key={service.id}
              position={service.location}
              icon={hospitalIcon}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-center">
                  <div className="font-bold text-sm">{service.name}</div>
                  <div className="text-xs text-gray-600">📞 {service.contact}</div>
                </div>
              </Tooltip>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-emerald-600">🏥 {service.name}</h3>
                  <p className="text-sm">Type: Hospital / Medical Facility</p>
                  <p className="text-sm">Contact: <span className="font-medium text-emerald-600">{service.contact}</span></p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Crime Radius Circles (30km) */}
          {filters.showCrimeRadius && crimeMarkers
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

        </MapContainer>

        {/* Crime Report Form Modal - Disabled for now, use main report form instead */}
        {/* {showReportForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Report a Crime</h2>
              <p className="text-sm text-gray-600">Please use the main crime report form to submit reports.</p>
              <button
                onClick={() => {
                  setShowReportForm(false);
                  setSelectedLocation(null);
                }}
                className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )} */}
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && crimeMarkers.length > 0 && (
        <div className="h-96 overflow-y-auto border-t">
          <Analytics 
            crimes={crimeMarkers.map(marker => ({
              id: marker.id,
              type: marker.offenseType as any,
              severity: marker.severity,
              location: marker.location,
              description: marker.description,
              timestamp: new Date(marker.createdAt),
              status: marker.status as any,
            }))} 
            emergencyServices={JAMAICA_EMERGENCY_SERVICES} 
            alertZones={[]} 
          />
        </div>
      )}
    </div>
  );
}

// Crime Report Form Component - Removed, use main report form instead

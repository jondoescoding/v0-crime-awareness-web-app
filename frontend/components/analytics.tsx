"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

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

interface AnalyticsProps {
  crimes: CrimeReport[];
  emergencyServices: EmergencyService[];
  alertZones: AlertZone[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

// Helper function to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function Analytics({ crimes, emergencyServices, alertZones }: AnalyticsProps) {
  // Process data for charts
  const crimeTypeData = crimes.reduce((acc, crime) => {
    acc[crime.type] = (acc[crime.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top crimes pie chart data (sorted by count)
  const topCrimesData = Object.entries(crimeTypeData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5) // Top 5 crimes
    .map(([type, count], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: COLORS[index % COLORS.length]
    }));

  const crimeTypeChartData = Object.entries(crimeTypeData).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count
  }));

  const severityData = crimes.reduce((acc, crime) => {
    acc[crime.severity] = (acc[crime.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityChartData = Object.entries(severityData).map(([severity, count]) => ({
    severity: severity.charAt(0).toUpperCase() + severity.slice(1),
    count,
    color: severity === 'low' ? '#22c55e' : 
           severity === 'medium' ? '#f59e0b' : 
           severity === 'high' ? '#ef4444' : '#dc2626'
  }));

  const statusData = crimes.reduce((acc, crime) => {
    acc[crime.status] = (acc[crime.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count
  }));

  // Enhanced time series data (last 30 days for better trend analysis)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  const crimeRatesData = last30Days.map(date => {
    const dayCrimes = crimes.filter(crime => {
      const crimeDate = new Date(crime.timestamp);
      return crimeDate.toDateString() === date.toDateString();
    });
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalCrimes: dayCrimes.length,
      highSeverity: dayCrimes.filter(c => c.severity === 'high' || c.severity === 'critical').length,
      mediumSeverity: dayCrimes.filter(c => c.severity === 'medium').length,
      lowSeverity: dayCrimes.filter(c => c.severity === 'low').length,
      active: dayCrimes.filter(c => c.status === 'active').length,
      resolved: dayCrimes.filter(c => c.status === 'resolved').length
    };
  });

  const serviceStatusData = emergencyServices.reduce((acc, service) => {
    acc[service.status] = (acc[service.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const serviceStatusChartData = Object.entries(serviceStatusData).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    color: status === 'available' ? '#22c55e' : 
           status === 'busy' ? '#f59e0b' : '#ef4444'
  }));

  // Find crimes not covered by police (within 5km of any police station)
  const policeStations = emergencyServices.filter(service => service.type === 'police');
  const uncoveredCrimes = crimes.filter(crime => {
    return !policeStations.some(station => {
      const distance = calculateDistance(
        crime.location[0], crime.location[1],
        station.location[0], station.location[1]
      );
      return distance <= 5; // 5km coverage radius
    });
  });

  // Find alert zones not covered by police
  const uncoveredAlertZones = alertZones.filter(zone => {
    return !policeStations.some(station => {
      const distance = calculateDistance(
        zone.center[0], zone.center[1],
        station.location[0], station.location[1]
      );
      return distance <= 5; // 5km coverage radius
    });
  });

  // Coverage statistics
  const coverageStats = {
    totalCrimes: crimes.length,
    coveredCrimes: crimes.length - uncoveredCrimes.length,
    uncoveredCrimes: uncoveredCrimes.length,
    totalAlertZones: alertZones.length,
    coveredAlertZones: alertZones.length - uncoveredAlertZones.length,
    uncoveredAlertZones: uncoveredAlertZones.length,
    coveragePercentage: Math.round(((crimes.length - uncoveredCrimes.length) / crimes.length) * 100) || 0
  };

  return (
    <div className="p-6 bg-white">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Crime Analytics Dashboard</h2>
      
      {/* Coverage Analysis Section */}
      <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border-l-4 border-red-500">
        <h3 className="text-xl font-bold mb-4 text-red-800">Police Coverage Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">{coverageStats.coveragePercentage}%</div>
            <div className="text-sm text-gray-600">Crime Coverage</div>
            <div className="text-xs text-gray-500 mt-1">
              {coverageStats.coveredCrimes} of {coverageStats.totalCrimes} crimes covered
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{coverageStats.uncoveredCrimes}</div>
            <div className="text-sm text-gray-600">Uncovered Crimes</div>
            <div className="text-xs text-gray-500 mt-1">Outside 5km police radius</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{coverageStats.uncoveredAlertZones}</div>
            <div className="text-sm text-gray-600">Uncovered Alert Zones</div>
            <div className="text-xs text-gray-500 mt-1">Need police presence</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Crimes Pie Chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Top Crimes (Pie Chart)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topCrimesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {topCrimesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Crime Rates Line Chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Crime Rates Over Time (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={crimeRatesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalCrimes" stroke="#3b82f6" strokeWidth={2} name="Total Crimes" />
              <Line type="monotone" dataKey="highSeverity" stroke="#ef4444" strokeWidth={2} name="High Severity" />
              <Line type="monotone" dataKey="mediumSeverity" stroke="#f59e0b" strokeWidth={2} name="Medium Severity" />
              <Line type="monotone" dataKey="lowSeverity" stroke="#22c55e" strokeWidth={2} name="Low Severity" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Crime Types Bar Chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Crime Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={crimeTypeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Crime Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ severity, count }) => `${severity}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {severityChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Uncovered Areas Details */}
      {(uncoveredCrimes.length > 0 || uncoveredAlertZones.length > 0) && (
        <div className="mt-8 bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
          <h3 className="text-xl font-bold mb-4 text-yellow-800">Areas Requiring Police Attention</h3>
          
          {uncoveredCrimes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2 text-yellow-700">Uncovered Crimes ({uncoveredCrimes.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {uncoveredCrimes.slice(0, 6).map(crime => (
                  <div key={crime.id} className="bg-white p-3 rounded border-l-4 border-yellow-400">
                    <div className="font-medium capitalize text-sm">{crime.type}</div>
                    <div className="text-xs text-gray-600">{crime.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Severity: <span className="font-medium" style={{ color: 
                        crime.severity === 'low' ? '#22c55e' : 
                        crime.severity === 'medium' ? '#f59e0b' : 
                        crime.severity === 'high' ? '#ef4444' : '#dc2626'
                      }}>{crime.severity}</span>
                    </div>
                  </div>
                ))}
                {uncoveredCrimes.length > 6 && (
                  <div className="bg-white p-3 rounded border-l-4 border-yellow-400 flex items-center justify-center">
                    <span className="text-sm text-gray-600">+{uncoveredCrimes.length - 6} more crimes</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {uncoveredAlertZones.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-2 text-yellow-700">Uncovered Alert Zones ({uncoveredAlertZones.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {uncoveredAlertZones.map(zone => (
                  <div key={zone.id} className="bg-white p-3 rounded border-l-4 border-yellow-400">
                    <div className="font-medium text-sm">{zone.name}</div>
                    <div className="text-xs text-gray-600">{zone.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Level: <span className="font-medium" style={{ color: 
                        zone.level === 'low' ? '#22c55e' : 
                        zone.level === 'medium' ? '#f59e0b' : 
                        zone.level === 'high' ? '#ef4444' : '#dc2626'
                      }}>{zone.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{crimes.length}</div>
          <div className="text-sm text-red-600">Total Crimes</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{emergencyServices.length}</div>
          <div className="text-sm text-blue-600">Emergency Services</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{alertZones.length}</div>
          <div className="text-sm text-yellow-600">Alert Zones</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {Math.round((crimes.filter(c => c.status === 'resolved').length / crimes.length) * 100) || 0}%
          </div>
          <div className="text-sm text-green-600">Resolution Rate</div>
        </div>
      </div>
    </div>
  );
}
"use client";

import React from "react";

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

interface SimpleAnalyticsProps {
  crimes: CrimeReport[];
  emergencyServices: EmergencyService[];
  alertZones: AlertZone[];
}

export default function SimpleAnalytics({ crimes, emergencyServices, alertZones }: SimpleAnalyticsProps) {
  return (
    <div className="p-6 bg-white">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Crime Analytics Dashboard</h2>
      
      {/* Simple Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Crime Types */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Crime Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(
            crimes.reduce((acc, crime) => {
              acc[crime.type] = (acc[crime.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([type, count]) => (
            <div key={type} className="bg-gray-50 p-4 rounded-lg">
              <div className="font-medium capitalize">{type}</div>
              <div className="text-2xl font-bold text-blue-600">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Crimes */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Crimes</h3>
        <div className="space-y-2">
          {crimes.slice(0, 5).map(crime => (
            <div key={crime.id} className="p-3 bg-gray-50 rounded border-l-4" 
                 style={{ borderLeftColor: 
                   crime.severity === 'low' ? '#22c55e' : 
                   crime.severity === 'medium' ? '#f59e0b' : 
                   crime.severity === 'high' ? '#ef4444' : '#dc2626'
                 }}>
              <div className="font-medium capitalize">{crime.type}</div>
              <div className="text-sm text-gray-600">{crime.description}</div>
              <div className="text-xs text-gray-500">
                {crime.timestamp.toLocaleDateString()} • {crime.severity}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

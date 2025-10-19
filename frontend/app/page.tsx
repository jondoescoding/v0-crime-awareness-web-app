"use client";

import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Shield, Users, MapPin, Activity, FileText, ArrowRight, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import type { Doc } from '../convex/_generated/dataModel';

export default function HomePage() {
  // Fetch recent statistics
  const criminalsData = useQuery(api.criminals.list, {});
  const reportsData = useQuery(api.crimeReports.list, {});

  // Calculate active areas (unique parishes with reports)
  const activeAreas = reportsData 
    ? new Set(reportsData.filter(r => r.parish).map(r => r.parish)).size
    : 0;

  // Calculate resolution rate (percentage of resolved/inactive reports)
  const resolvedCount = reportsData 
    ? reportsData.filter(r => r.status !== 'active').length
    : 0;
  const totalReports = reportsData?.length || 0;
  const resolutionRate = totalReports > 0 
    ? Math.round((resolvedCount / totalReports) * 100)
    : 0;

  const stats = [
    {
      icon: Users,
      label: 'Known Criminals',
      value: criminalsData?.length || 0,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      icon: FileText,
      label: 'Crime Reports',
      value: totalReports,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      icon: MapPin,
      label: 'Active Areas',
      value: activeAreas,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: TrendingUp,
      label: 'Resolution Rate',
      value: `${resolutionRate}%`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  const quickActions = [
    {
      title: 'Report Crime',
      description: 'Submit a new crime report or report activity from existing criminals',
      icon: FileText,
      href: '/report',
      color: 'bg-black text-white hover:bg-gray-800'
    },
    {
      title: 'Criminal Database',
      description: 'Search and browse known criminals in your area',
      icon: Users,
      href: '/database',
      color: 'border-2 border-black text-black hover:bg-black hover:text-white'
    },
    {
      title: 'Activity Feed',
      description: 'View real-time updates on criminal activity',
      icon: Activity,
      href: '/feed',
      color: 'border-2 border-gray-300 text-gray-700 hover:border-black hover:text-black'
    },
    {
      title: 'Crime Map',
      description: 'Explore crime locations and criminal activity on the map',
      icon: MapPin,
      href: '/map',
      color: 'border-2 border-gray-300 text-gray-700 hover:border-black hover:text-black'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-black to-gray-900"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Crime Awareness
              <span className="block text-gray-300">Platform</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Help keep your community safe by reporting criminal activity, 
              staying informed about local threats, and working together to prevent crime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/report"
                className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2 shadow-lg"
              >
                <FileText size={20} />
                Report Crime
              </a>
              <a
                href="/map"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors inline-flex items-center gap-2"
              >
                <MapPin size={20} />
                View Crime Map
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">Platform Statistics</h2>
            <p className="text-gray-600">Real-time data on criminal activity and community safety</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-6 hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.borderColor} border`}>
                    <stat.icon size={24} className={stat.color} />
                  </div>
                </div>
                <div className="mb-1">
                  <div className="text-3xl font-bold text-black">{stat.value}</div>
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">Take Action</h2>
            <p className="text-gray-600">Choose how you want to contribute to community safety</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className={`${action.color} rounded-lg p-6 transition-all hover:shadow-lg group block`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <action.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:flex group-hover:items-center group-hover:gap-2">
                      {action.title}
                      <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="opacity-90">{action.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-black mb-2">Recent Activity</h2>
              <p className="text-gray-600">Latest crime reports and updates</p>
            </div>
            <a
              href="/feed"
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2 font-medium shadow-lg"
            >
              View All
              <ArrowRight size={16} />
            </a>
          </div>

          {reportsData && reportsData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportsData.slice(0, 3).map((report: Doc<"crimeReports">) => (
                <div
                  key={report._id}
                  className="bg-white rounded-lg p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {report.offenseType}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      Recent
                    </div>
                  </div>
                  
                  <p className="text-gray-800 mb-3 line-clamp-2">
                    {report.description}
                  </p>
                  
                  {report.cityState && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin size={14} className="mr-1" />
                      {report.cityState}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <AlertTriangle size={12} className="mr-1" />
                      Report #{report._id}
                    </div>
                    <a
                      href={`/feed`}
                      className="text-sm text-black hover:underline font-medium"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">No recent activity</h3>
              <p className="text-gray-600 mb-4">Be the first to report criminal activity in your area</p>
              <a
                href="/report"
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2 font-medium"
              >
                <FileText size={16} />
                Submit Report
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Shield size={24} />
                <span className="text-xl font-bold">Crime Awareness</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Working together to keep our communities safe through awareness, 
                reporting, and collaborative crime prevention efforts.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <nav className="space-y-2">
                <a href="/report" className="block text-gray-300 hover:text-white transition-colors">
                  Report Crime
                </a>
                <a href="/database" className="block text-gray-300 hover:text-white transition-colors">
                  Criminal Database
                </a>
                <a href="/feed" className="block text-gray-300 hover:text-white transition-colors">
                  Activity Feed
                </a>
                <a href="/map" className="block text-gray-300 hover:text-white transition-colors">
                  Crime Map
                </a>
              </nav>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Safety Tips</h3>
              <ul className="space-y-2 text-gray-300">
                <li>Report suspicious activity immediately</li>
                <li>Stay aware of your surroundings</li>
                <li>Trust your instincts</li>
                <li>Keep emergency contacts handy</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Crime Awareness Platform. Helping communities stay safe.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

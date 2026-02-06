'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminNav from '@/app/components/AdminNav'
import { BarChart3, Eye, ThumbsUp, Share2, Navigation } from 'lucide-react'

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalViews: 0,
    totalHelpful: 0,
    totalShares: 0,
    totalDirections: 0,
  })
  const [topLocations, setTopLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    try {
      // Get overall stats
      const { data: statsData } = await supabase
        .from('location_stats')
        .select('view_count, helpful_count, share_count, directions_count')

      if (statsData) {
        const totals = statsData.reduce((acc, curr) => ({
          totalViews: acc.totalViews + (curr.view_count || 0),
          totalHelpful: acc.totalHelpful + (curr.helpful_count || 0),
          totalShares: acc.totalShares + (curr.share_count || 0),
          totalDirections: acc.totalDirections + (curr.directions_count || 0),
        }), { totalViews: 0, totalHelpful: 0, totalShares: 0, totalDirections: 0 })
        
        setStats(totals)
      }

      // Get top locations
      const { data: topData } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          stats:location_stats(view_count, helpful_count)
        `)
        .order('stats.view_count', { ascending: false })
        .limit(10)

      setTopLocations(topData || [])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="analytics" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mobile App Analytics</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <ThumbsUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Helpful Votes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHelpful.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Share2 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Shares</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalShares.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Navigation className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Directions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDirections.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top 10 Most Viewed Locations</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Helpful
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topLocations.map((location: any, index: number) => (
                  <tr key={location.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          #{index + 1} {location.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {location.stats?.[0]?.view_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {location.stats?.[0]?.helpful_count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

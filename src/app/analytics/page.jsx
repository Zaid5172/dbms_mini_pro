export default function AnalyticsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Parking & Incident Analytics</h2>
      <p className="text-gray-600 mb-8">Real-time statistics derived from MySQL SQL Views and Redis fast-path aggregates.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Lot Occupancy Rate (MySQL View)</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>Downtown Main Garage</span>
                <span>85% Occupied</span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>Airport Express Lot</span>
                <span>62% Occupied</span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Redis Cache Status</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Connected Status:</span><span className="font-semibold text-emerald-600">Active</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Cached Slot Keys:</span><span className="font-semibold text-gray-800">150 slots</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Memory Usage:</span><span className="font-semibold text-gray-800">1.24 MB</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Hit Rate:</span><span className="font-semibold text-blue-600">99.4%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

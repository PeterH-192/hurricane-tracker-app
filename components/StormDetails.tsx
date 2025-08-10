import * as React from 'react';
import { Storm } from '../types';
import ForecastChart from './ForecastChart';
import { StormCategoryIcon } from './icons';

interface StormDetailsProps {
  storm: Storm | null;
}

const DetailItem: React.FC<{ icon: string; label: string; value: string | number; unit?: string }> = ({ icon, label, value, unit }) => (
    <div className="flex items-center bg-slate-700/50 p-3 rounded-lg">
        <i className={`${icon} text-xl text-cyan-400 w-8 text-center`}></i>
        <div className="ml-3">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-lg font-semibold text-white">{value} <span className="text-sm font-normal text-slate-300">{unit}</span></p>
        </div>
    </div>
);


const StormDetails: React.FC<StormDetailsProps> = ({ storm }) => {
  if (!storm) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-800 rounded-lg p-8 text-center">
        <i className="fa-solid fa-map-location-dot text-6xl text-slate-600 mb-4"></i>
        <h3 className="text-xl font-bold text-slate-300">Select a Storm</h3>
        <p className="text-slate-400">Choose a storm from the map or the dropdown to see its details.</p>
      </div>
    );
  }
  
  const getCategoryColorClass = (category: number) => {
    if (category === 0) return 'text-green-400';
    if (category === 1) return 'text-yellow-300';
    if (category === 2) return 'text-yellow-400';
    if (category === 3) return 'text-orange-500';
    if (category === 4) return 'text-red-500';
    if (category === 5) return 'text-red-700';
    return 'text-slate-400';
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 md:p-6 h-full overflow-y-auto">
      <div className="flex items-start justify-between mb-4">
        <div>
           <h2 className="text-2xl md:text-3xl font-bold text-white">{storm.name}</h2>
           <p className={`font-semibold ${getCategoryColorClass(storm.category)}`}>
            {storm.type === 'Hurricane' ? `Category ${storm.category} Hurricane` : storm.type}
           </p>
        </div>
        <div className="w-16 h-16">
            <StormCategoryIcon category={storm.category} type={storm.type} />
        </div>
      </div>
      
      <p className="text-slate-300 mb-6 italic">{storm.summary}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <DetailItem icon="fa-solid fa-wind" label="Max Wind Speed" value={storm.windSpeed} unit="mph" />
        <DetailItem icon="fa-solid fa-gauge-high" label="Pressure" value={storm.pressure} unit="mb" />
        <DetailItem icon="fa-solid fa-location-crosshairs" label="Latitude" value={storm.location.lat.toFixed(1)} unit="°N" />
        <DetailItem icon="fa-solid fa-location-crosshairs" label="Longitude" value={storm.location.lon.toFixed(1)} unit="°W" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-2">5-Day Forecast</h3>
        <ForecastChart forecastData={storm.forecast} />
      </div>

    </div>
  );
};

export default StormDetails;
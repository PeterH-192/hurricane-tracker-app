import * as React from 'react';
import { Storm } from '../types';

interface StormSelectorProps {
  storms: Storm[];
  selectedStorm: Storm | null;
  onSelectStorm: (storm: Storm | null) => void;
}

const StormSelector: React.FC<StormSelectorProps> = ({ storms, selectedStorm, onSelectStorm }) => {
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const stormId = event.target.value;
    if (stormId === "") {
        onSelectStorm(null);
        return;
    }
    const storm = storms.find(s => s.id === stormId) || null;
    onSelectStorm(storm);
  };

  return (
    <div className="mb-4">
      <label htmlFor="storm-select" className="block text-sm font-medium text-slate-400 mb-1">
        Select a Storm
      </label>
      <select
        id="storm-select"
        value={selectedStorm?.id || ''}
        onChange={handleSelectChange}
        className="block w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
      >
        <option value="">-- View All Storms on Map --</option>
        {storms.map(storm => (
          <option key={storm.id} value={storm.id}>
            {storm.name} ({storm.type})
          </option>
        ))}
      </select>
    </div>
  );
};

export default StormSelector;
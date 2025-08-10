import * as React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Storm } from '../types';
import { StormCategoryIcon } from './icons';

interface MapProps {
  storms: Storm[];
  selectedStorm: Storm | null;
  onSelectStorm: (storm: Storm) => void;
}

// Helper to create custom storm icons using React components
const createStormIcon = (storm: Storm, isSelected: boolean) => {
  const iconSize = isSelected ? 60 : 40;
  const iconHtml = ReactDOMServer.renderToString(
    <StormCategoryIcon category={storm.category} type={storm.type} className="w-full h-full" />
  );

  return L.divIcon({
    html: iconHtml,
    className: 'bg-transparent border-0',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
  });
};

// This component will handle panning the map to the selected storm
const MapFlyTo: React.FC<{ storm: Storm | null }> = ({ storm }) => {
    const map = useMap();
    React.useEffect(() => {
        if (storm) {
            map.flyTo([storm.location.lat, storm.location.lon], map.getZoom(), {
                animate: true,
                duration: 1.5
            });
        }
    }, [storm, map]);
    return null;
}

const Map: React.FC<MapProps> = ({ storms, selectedStorm, onSelectStorm }) => {
  const mapCenter: [number, number] = [25, -55]; // Centered on the Atlantic basin

  return (
    <div className="relative w-full h-96 md:h-full rounded-lg overflow-hidden shadow-2xl">
      <MapContainer center={mapCenter} zoom={4} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {storms.map(storm => {
          const isSelected = selectedStorm?.id === storm.id;
          return (
            <Marker
              key={storm.id}
              position={[storm.location.lat, storm.location.lon]}
              icon={createStormIcon(storm, isSelected)}
              eventHandlers={{
                click: () => onSelectStorm(storm),
              }}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              <Tooltip
                direction="top"
                offset={[0, -20]}
                opacity={1}
                className="bg-slate-800 text-white rounded-md border-slate-700"
              >
                <span>{storm.name}</span>
              </Tooltip>
            </Marker>
          );
        })}
        <MapFlyTo storm={selectedStorm} />
      </MapContainer>
    </div>
  );
};

export default Map;
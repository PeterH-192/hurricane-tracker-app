import * as React from 'react';
import { Storm, WeatherModel } from './types';
import { getWeatherData } from './services/weatherService';
import Header from './components/Header';
import Map from './components/Map';
import StormSelector from './components/StormSelector';
import StormDetails from './components/StormDetails';
import ModelSelector from './components/ModelSelector';

const App: React.FC = () => {
  const [allModels, setAllModels] = React.useState<WeatherModel[]>([]);
  const [selectedModelId, setSelectedModelId] = React.useState<string>('');
  const [currentStorms, setCurrentStorms] = React.useState<Storm[]>([]);
  const [selectedStorm, setSelectedStorm] = React.useState<Storm | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getWeatherData();
        setAllModels(data);
        if (data && data.length > 0) {
          const defaultModelId = data[0].id;
          setSelectedModelId(defaultModelId);
          setCurrentStorms(data[0].storms);
        } else {
          setCurrentStorms([]);
        }
      } catch (err) {
        console.error("Failed to fetch weather data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();
  }, []);
  
  const handleSelectModel = React.useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    const model = allModels.find(m => m.id === modelId);
    setCurrentStorms(model ? model.storms : []);
    setSelectedStorm(null); // Reset storm selection when model changes
  }, [allModels]);


  const handleSelectStorm = React.useCallback((storm: Storm | null) => {
    setSelectedStorm(storm);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center p-4">
        <div className="flex flex-col items-center bg-slate-800 p-8 rounded-lg shadow-2xl">
          <i className="fa-solid fa-triangle-exclamation text-5xl text-red-500 mb-4"></i>
          <h2 className="text-2xl text-slate-200 mb-2 font-bold">Error Fetching Live Data</h2>
          <p className="text-slate-400 max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <i className="fa-solid fa-cloud-bolt text-5xl text-cyan-400 animate-pulse mb-4"></i>
          <p className="text-xl text-slate-300">Fetching Latest Weather Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 flex flex-col md:flex-row gap-4">
        <div className="md:w-3/5 lg:w-2/3 h-full flex flex-col">
          <Map storms={currentStorms} selectedStorm={selectedStorm} onSelectStorm={handleSelectStorm} />
        </div>
        <div className="md:w-2/5 lg:w-1/3 h-full flex flex-col">
           <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <ModelSelector 
              models={allModels.map(m => ({ id: m.id, name: m.name }))}
              selectedModelId={selectedModelId}
              onSelectModel={handleSelectModel}
            />
            <StormSelector storms={currentStorms} selectedStorm={selectedStorm} onSelectStorm={handleSelectStorm} />
          </div>
          <div className="flex-grow">
            <StormDetails storm={selectedStorm} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
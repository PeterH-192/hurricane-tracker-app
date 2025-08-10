
export interface ForecastPoint {
  day: string;
  lat: number;
  lon: number;
  windSpeed: number;
  pressure: number;
  category: number;
}

export interface Storm {
  id: string;
  name:string;
  type: 'Hurricane' | 'Tropical Storm' | 'Invest';
  category: number;
  windSpeed: number; // mph
  pressure: number; // mb
  location: {
    lat: number;
    lon: number;
  };
  summary: string;
  forecast: ForecastPoint[];
}

export interface WeatherModel {
  id: string;
  name: string;
  storms: Storm[];
}
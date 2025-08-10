import { WeatherModel } from '../types';

export const mockWeatherData: WeatherModel[] = [
  {
    id: 'gfs',
    name: 'GFS Model',
    storms: [
      {
        id: 'AL012024-GFS',
        name: 'Hurricane Alpha',
        type: 'Hurricane',
        category: 2,
        windSpeed: 105,
        pressure: 975,
        location: { lat: 25.5, lon: -75.0 },
        summary: 'Hurricane Alpha is currently a Category 2 hurricane, expected to strengthen over the next 24 hours.',
        forecast: [
          { day: 'Day 1', lat: 26.5, lon: -76.0, windSpeed: 115, pressure: 965, category: 3 },
          { day: 'Day 2', lat: 27.8, lon: -77.5, windSpeed: 125, pressure: 955, category: 3 },
          { day: 'Day 3', lat: 29.0, lon: -79.0, windSpeed: 130, pressure: 948, category: 4 },
          { day: 'Day 4', lat: 30.5, lon: -80.0, windSpeed: 120, pressure: 958, category: 3 },
          { day: 'Day 5', lat: 32.0, lon: -79.5, windSpeed: 100, pressure: 978, category: 2 },
        ],
      },
      {
        id: 'AL022024-GFS',
        name: 'Tropical Storm Beta',
        type: 'Tropical Storm',
        category: 0,
        windSpeed: 60,
        pressure: 1002,
        location: { lat: 15.2, lon: -45.8 },
        summary: 'Tropical Storm Beta is moving west and is not expected to strengthen significantly.',
        forecast: [
          { day: 'Day 1', lat: 15.5, lon: -47.0, windSpeed: 65, pressure: 1000, category: 0 },
          { day: 'Day 2', lat: 15.8, lon: -48.5, windSpeed: 65, pressure: 1000, category: 0 },
          { day: 'Day 3', lat: 16.1, lon: -50.0, windSpeed: 70, pressure: 998, category: 0 },
          { day: 'Day 4', lat: 16.5, lon: -51.8, windSpeed: 65, pressure: 1001, category: 0 },
          { day: 'Day 5', lat: 17.0, lon: -53.5, windSpeed: 60, pressure: 1003, category: 0 },
        ],
      },
    ],
  },
  {
    id: 'ecmwf',
    name: 'ECMWF Model',
    storms: [
      {
        id: 'AL012024-ECMWF',
        name: 'Hurricane Alpha',
        type: 'Hurricane',
        category: 2,
        windSpeed: 110,
        pressure: 972,
        location: { lat: 25.7, lon: -75.2 },
        summary: 'ECMWF model shows a slightly stronger Hurricane Alpha, with a more northward track.',
        forecast: [
          { day: 'Day 1', lat: 27.0, lon: -76.5, windSpeed: 120, pressure: 960, category: 3 },
          { day: 'Day 2', lat: 28.5, lon: -78.0, windSpeed: 130, pressure: 950, category: 4 },
          { day: 'Day 3', lat: 30.0, lon: -80.0, windSpeed: 135, pressure: 945, category: 4 },
          { day: 'Day 4', lat: 31.8, lon: -80.5, windSpeed: 125, pressure: 955, category: 3 },
          { day: 'Day 5', lat: 33.5, lon: -80.0, windSpeed: 110, pressure: 970, category: 2 },
        ],
      },
    ],
  },
  {
    id: 'ukmet',
    name: 'UKMET Model',
    storms: [
       {
        id: 'AL012024-UKMET',
        name: 'Hurricane Alpha',
        type: 'Hurricane',
        category: 2,
        windSpeed: 100,
        pressure: 980,
        location: { lat: 25.3, lon: -74.8 },
        summary: 'UKMET model shows a weaker Hurricane Alpha, tracking further east.',
        forecast: [
          { day: 'Day 1', lat: 26.0, lon: -75.5, windSpeed: 110, pressure: 970, category: 2 },
          { day: 'Day 2', lat: 27.0, lon: -76.5, windSpeed: 115, pressure: 965, category: 3 },
          { day: 'Day 3', lat: 28.5, lon: -77.0, windSpeed: 115, pressure: 965, category: 3 },
          { day: 'Day 4', lat: 29.8, lon: -77.0, windSpeed: 110, pressure: 970, category: 2 },
          { day: 'Day 5', lat: 31.0, lon: -76.5, windSpeed: 100, pressure: 975, category: 2 },
        ],
      },
      {
        id: 'INVEST01-UKMET',
        name: 'Invest 95L',
        type: 'Invest',
        category: 0,
        windSpeed: 30,
        pressure: 1010,
        location: { lat: 12.1, lon: -35.5 },
        summary: 'A new tropical wave being monitored for development.',
        forecast: [
          { day: 'Day 1', lat: 12.5, lon: -37.0, windSpeed: 30, pressure: 1010, category: 0 },
          { day: 'Day 2', lat: 13.0, lon: -39.0, windSpeed: 35, pressure: 1008, category: 0 },
          { day: 'Day 3', lat: 13.5, lon: -41.5, windSpeed: 40, pressure: 1005, category: 0 },
          { day: 'Day 4', lat: 14.0, lon: -44.0, windSpeed: 45, pressure: 1002, category: 0 },
          { day: 'Day 5', lat: 14.5, lon: -46.5, windSpeed: 50, pressure: 1000, category: 0 },
        ],
      },
    ]
  }
];

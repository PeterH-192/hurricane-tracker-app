import * as React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ForecastPoint } from '../types';

interface ForecastChartProps {
  forecastData: ForecastPoint[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-700/80 backdrop-blur-sm p-3 border border-slate-600 rounded-lg shadow-lg">
        <p className="font-bold text-slate-200">{`${label} Forecast`}</p>
        <p className="text-cyan-400">{`Wind: ${data.windSpeed} mph`}</p>
        <p className="text-amber-400">{`Pressure: ${data.pressure} mb`}</p>
        <p className="text-slate-300">{`Category: ${data.category > 0 ? data.category : 'TS/TD'}`}</p>
      </div>
    );
  }
  return null;
};

const ForecastChart: React.FC<ForecastChartProps> = ({ forecastData }) => {
  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer>
        <LineChart
          data={forecastData}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
          <YAxis yAxisId="left" stroke="#06b6d4" fontSize={12} label={{ value: 'Wind (mph)', angle: -90, position: 'insideLeft', fill: '#06b6d4', style: {textAnchor: 'middle'} }} />
          <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={12} label={{ value: 'Pressure (mb)', angle: 90, position: 'insideRight', fill: '#f59e0b', style: {textAnchor: 'middle'} }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{fontSize: "14px"}} />
          <Line yAxisId="left" type="monotone" dataKey="windSpeed" name="Max Wind" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
          <Line yAxisId="right" type="monotone" dataKey="pressure" name="Pressure" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;
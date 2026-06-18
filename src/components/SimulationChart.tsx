import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import type { SimulationParams } from '../types';

// A set of nice colors for different farmers
const FARMER_COLORS = ['#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#eab308', '#ef4444'];

interface SimulationChartProps {
  params: SimulationParams;
}

export const SimulationChart: React.FC<SimulationChartProps> = ({ params }) => {
  const chartData = useMemo(() => {
    const data = [];
    
    const fee = Number(params.fee) || 0;
    const pumpOwnerArea = Number(params.pumpOwnerArea) || 0;
    const electricity = Number(params.electricity) || 0;
    const waterReductionRate = Number(params.waterReductionRate) || 0;

    const totalFarmerArea = params.farmers.reduce((sum, f) => sum + (Number(f.area) || 0), 0);
    const totalArea = totalFarmerArea + pumpOwnerArea;
    const farmerShareRatio = totalArea > 0 ? totalFarmerArea / totalArea : 0;

    const totalFeeFromAllFarmers = fee * totalFarmerArea;
    const farmerElectricityShare = electricity * farmerShareRatio;
    const newFarmerElectricityCost = farmerElectricityShare * (1 - waterReductionRate / 100);

    // 1% step from 0 to 100
    for (let r = 0; r <= 100; r += 1) {
      const point: any = { returnRate: r };
      
      // Calculate each individual farmer's profit
      params.farmers.forEach(farmer => {
        const area = Number(farmer.area) || 0;
        const farmerFee = fee * area;
        const profit = farmerFee * (r / 100);
        point[`farmer_${farmer.id}`] = Math.round(profit);
      });
      
      // Pump owner's profit is the remaining fee minus the new electricity cost for the farmers' portion
      const pumpOwnerProfit = totalFeeFromAllFarmers * (1 - (r / 100)) - newFarmerElectricityCost;
      point.pumpOwnerProfit = Math.round(pumpOwnerProfit);

      data.push(point);
    }
    return data;
  }, [params]);

  const currentData = chartData.find(d => d.returnRate === params.returnRate) || chartData[0];

  return (
    <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-slate-100/50 flex flex-col h-full">
      <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
        </span>
        Profit Simulation Results (Farmers' Portion Only)
      </h2>
      <p className="text-sm text-slate-500 mb-6">Trend of individual profits for each farmer and the pump owner</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {params.farmers.map((farmer, idx) => {
          const color = FARMER_COLORS[idx % FARMER_COLORS.length];
          const profit = currentData[`farmer_${farmer.id}`] as number;
          return (
            <div key={farmer.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200" style={{ borderLeftColor: color, borderLeftWidth: '4px' }}>
              <div className="text-xs font-medium text-slate-600 mb-1 truncate">{farmer.name} ({farmer.area}{params.areaUnit})</div>
              <div className="text-lg font-bold" style={{ color }}>{profit.toLocaleString()} <span className="text-xs font-normal text-slate-500">Taka</span></div>
            </div>
          );
        })}
        <div className="bg-indigo-50 rounded-xl p-3 border-l-4 border-l-indigo-600 border-indigo-100 col-span-2 md:col-span-1">
          <div className="text-xs font-medium text-indigo-800 mb-1">Pump Owner</div>
          <div className="text-lg font-bold text-indigo-600">{(currentData.pumpOwnerProfit as number).toLocaleString()} <span className="text-xs font-normal">Taka</span></div>
        </div>
      </div>

      <div className="flex-grow min-h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="returnRate" 
              tickFormatter={(value) => `${value}%`}
              stroke="#64748b"
              tick={{fill: '#64748b', fontSize: 12}}
              tickMargin={10}
            />
            <YAxis 
              stroke="#64748b"
              tick={{fill: '#64748b', fontSize: 12}}
              tickFormatter={(value) => `${value.toLocaleString()}`}
            />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Tooltip 
              formatter={(value: any) => [`${Number(value).toLocaleString()} Taka`, '']}
              labelFormatter={(label) => `Return Rate: ${label}%`}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <ReferenceLine 
              x={params.returnRate} 
              stroke="#cbd5e1" 
              strokeDasharray="3 3" 
              label={{ position: 'top', value: 'Current Setting', fill: '#94a3b8', fontSize: 12 }} 
            />
            <ReferenceLine 
              y={0} 
              stroke="#f43f5e" 
              strokeDasharray="3 3" 
              label={{ position: 'insideTopLeft', value: 'Break-even Point (Profit = 0)', fill: '#f43f5e', fontSize: 12 }} 
            />

            {params.farmers.map((farmer, idx) => (
              <Line 
                key={farmer.id}
                type="monotone" 
                dataKey={`farmer_${farmer.id}`} 
                name={farmer.name} 
                stroke={FARMER_COLORS[idx % FARMER_COLORS.length]} 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: FARMER_COLORS[idx % FARMER_COLORS.length], stroke: '#fff', strokeWidth: 2 }}
              />
            ))}

            <Line 
              type="monotone" 
              dataKey="pumpOwnerProfit" 
              name="Pump Owner's Profit" 
              stroke="#6366f1" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

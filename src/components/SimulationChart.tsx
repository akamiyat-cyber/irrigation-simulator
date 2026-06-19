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

const FARMER_COLORS = ['#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#eab308', '#ef4444'];

interface SimulationChartProps {
  params: SimulationParams;
}

export const SimulationChart: React.FC<SimulationChartProps> = ({ params }) => {
  const chartData = useMemo(() => {
    const data = [];
    
    const fee = Number(params.fee) || 0;
    const pumpOwnerArea = Number(params.pumpOwnerArea) || 0;
    const waterReductionRate = Number(params.waterReductionRate) || 0;
    const doesOwnerPay = params.doesPumpOwnerPayFee;
    const ownerFee = doesOwnerPay ? (Number(params.pumpOwnerFee) || 0) : 0;

    const totalFarmerArea = params.farmers.reduce((sum, f) => sum + (Number(f.area) || 0), 0);
    const totalArea = totalFarmerArea + pumpOwnerArea;
    const farmerShareRatio = totalArea > 0 ? totalFarmerArea / totalArea : 0;

    const totalFeeFromFarmers = fee * totalFarmerArea;
    const totalCollectedFees = totalFeeFromFarmers + (doesOwnerPay ? ownerFee * pumpOwnerArea : 0);

    // Calculate base expenses
    const electricity = Number(params.electricity) || 0;
    const laborCost = Number(params.laborCost) || 0;
    const otherCost = Number(params.otherCost) || 0;
    
    // Electricity costs to subtract
    const newTotalElectricityCost = electricity * (1 - waterReductionRate / 100);
    const newFarmerElectricityCost = (electricity * farmerShareRatio) * (1 - waterReductionRate / 100);

    // Total expenses
    const totalExpenses = newTotalElectricityCost + laborCost + otherCost;
    const farmerShareExpenses = newFarmerElectricityCost + ((laborCost + otherCost) * farmerShareRatio);

    // Calculate Baseline and Break-even points
    let baselinePumpBusinessProfit = 0;
    let savings = 0;
    let maxReturnRate = 0;

    if (doesOwnerPay) {
      baselinePumpBusinessProfit = totalCollectedFees - (electricity + laborCost + otherCost);
      savings = electricity - newTotalElectricityCost;
      maxReturnRate = totalCollectedFees > 0 ? (savings / totalCollectedFees) * 100 : 0;
    } else {
      const originalFarmerShareExpenses = (electricity + laborCost + otherCost) * farmerShareRatio;
      baselinePumpBusinessProfit = totalFeeFromFarmers - originalFarmerShareExpenses;
      savings = (electricity * farmerShareRatio) - newFarmerElectricityCost;
      maxReturnRate = totalFeeFromFarmers > 0 ? (savings / totalFeeFromFarmers) * 100 : 0;
    }
    const maxDiscountAmount = fee * (maxReturnRate / 100);
    const currentDiscountAmount = fee * ((Number(params.returnRate) || 0) / 100);

    for (let r = 0; r <= 100; r += 1) {
      const point: any = { returnRate: r };
      
      // 1. Calculate each individual farmer's profit (discount)
      params.farmers.forEach(farmer => {
        const area = Number(farmer.area) || 0;
        const farmerFeeAmount = fee * area;
        const profit = farmerFeeAmount * (r / 100);
        point[`farmer_${farmer.id}`] = Math.round(profit);
      });
      
      if (doesOwnerPay) {
        // Owner acts as a farmer too, so they get a discount
        const ownerFeeAmount = ownerFee * pumpOwnerArea;
        const ownerFarmerProfit = ownerFeeAmount * (r / 100);
        point.ownerFarmerProfit = Math.round(ownerFarmerProfit);

        // Pump Business Profit: Total collected from EVERYONE minus the FULL expenses
        const pumpBusinessProfit = totalCollectedFees * (1 - (r / 100)) - totalExpenses;
        point.pumpBusinessProfit = Math.round(pumpBusinessProfit);
        
      } else {
        // Old logic: Pump owner doesn't pay, we isolate the farmer's portion of the business
        const pumpOwnerProfit = totalFeeFromFarmers * (1 - (r / 100)) - farmerShareExpenses;
        point.pumpBusinessProfit = Math.round(pumpOwnerProfit);
      }

      data.push(point);
    }
    return data;
  }, [params]);

  const currentData = chartData.find(d => d.returnRate === params.returnRate) || chartData[0];

  const handleExportCSV = () => {
    // 1. Create Headers
    const headers = ['Return Rate (%)'];
    params.farmers.forEach(f => headers.push(`${f.name} Profit (Taka)`));
    if (params.doesPumpOwnerPayFee) {
      headers.push("Owner's Farmer Discount (Taka)");
    }
    headers.push("Pump Business Profit (Taka)");

    // 2. Create Rows
    const rows = chartData.map(point => {
      const row = [point.returnRate];
      params.farmers.forEach(f => row.push(point[`farmer_${f.id}`]));
      if (params.doesPumpOwnerPayFee) {
        row.push(point.ownerFarmerProfit || 0);
      }
      row.push(point.pumpBusinessProfit);
      return row.join(',');
    });

    // 3. Trigger Download
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'simulation_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md shadow-xl print:shadow-none rounded-2xl p-6 border border-slate-100/50 print:border-none flex flex-col h-full print:h-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg print:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
            </span>
            Profit Simulation Results
          </h2>
          <p className="text-sm text-slate-500">Trend of individual profits for each farmer and the pump business</p>
        </div>
        
        <div className="flex gap-2 print:hidden">
          <button 
            onClick={handleExportCSV} 
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors border border-emerald-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Excel (CSV)
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold transition-colors border border-slate-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            PDF / Print
          </button>
        </div>
      </div>

      {/* Win-Win Dashboard */}
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-4 mb-6 border border-blue-100 flex flex-col md:flex-row gap-4 justify-between items-center print:break-inside-avoid shadow-sm">
        <div className="text-sm text-center md:text-left flex-1">
          <p className="text-slate-600 mb-1 font-medium">
            Current Farmer Discount (at {params.returnRate}%):
          </p>
          <p className="font-bold text-blue-700 text-2xl">
            {Math.round(currentDiscountAmount).toLocaleString()} <span className="text-sm font-normal">Taka/{params.areaUnit}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            New Fee: <span className="font-semibold text-slate-700">{Math.round(fee - currentDiscountAmount).toLocaleString()}</span> Taka
          </p>
        </div>
        <div className="hidden md:block w-px h-16 bg-blue-200"></div>
        <div className="text-sm text-center md:text-left flex-1">
          <p className="text-slate-600 mb-1 font-medium flex items-center justify-center md:justify-start gap-1">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Max Win-Win Discount (Owner keeps baseline profit):
          </p>
          <p className="font-bold text-emerald-700 text-2xl">
            {Math.round(maxDiscountAmount).toLocaleString()} <span className="text-sm font-normal">Taka/{params.areaUnit}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Max Return Rate: <span className="font-semibold text-slate-700">{Math.max(0, (Math.floor(maxReturnRate * 10) / 10))}%</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar print:max-h-none print:overflow-visible">
        {params.farmers.map((farmer, idx) => {
          const color = FARMER_COLORS[idx % FARMER_COLORS.length];
          const profit = currentData[`farmer_${farmer.id}`] as number;
          return (
            <div key={farmer.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200 print:break-inside-avoid" style={{ borderLeftColor: color, borderLeftWidth: '4px' }}>
              <div className="text-xs font-medium text-slate-600 mb-1 truncate">{farmer.name} ({farmer.area}{params.areaUnit})</div>
              <div className="text-lg font-bold" style={{ color }}>{profit.toLocaleString()} <span className="text-xs font-normal text-slate-500">Taka</span></div>
            </div>
          );
        })}
        {params.doesPumpOwnerPayFee && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-slate-400 print:break-inside-avoid">
            <div className="text-xs font-medium text-slate-600 mb-1 truncate">Owner (as Farmer)</div>
            <div className="text-lg font-bold text-slate-500">{(currentData.ownerFarmerProfit as number).toLocaleString()} <span className="text-xs font-normal text-slate-500">Taka</span></div>
          </div>
        )}
        <div className="bg-indigo-50 rounded-xl p-3 border-l-4 border-l-indigo-600 border-indigo-100 col-span-2 md:col-span-1 print:break-inside-avoid">
          <div className="text-xs font-medium text-indigo-800 mb-1">Pump Business</div>
          <div className="text-lg font-bold text-indigo-600">{(currentData.pumpBusinessProfit as number).toLocaleString()} <span className="text-xs font-normal">Taka</span></div>
        </div>
      </div>

      <div className="flex-grow min-h-[350px] w-full print:min-h-[500px]">
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
              stroke="#6366f1" 
              strokeDasharray="4 4" 
              label={{ position: 'top', value: 'Current Setting', fill: '#6366f1', fontSize: 12, fontWeight: 'bold' }} 
            />
            <ReferenceLine 
              y={baselinePumpBusinessProfit} 
              stroke="#ef4444" 
              strokeDasharray="3 3" 
              label={{ position: 'insideTopLeft', value: 'Baseline Owner Profit', fill: '#ef4444', fontSize: 12 }} 
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

            {params.doesPumpOwnerPayFee && (
              <Line 
                type="monotone" 
                dataKey="ownerFarmerProfit" 
                name="Owner's Farmer Discount" 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 5, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }}
              />
            )}

            <Line 
              type="monotone" 
              dataKey="pumpBusinessProfit" 
              name="Pump Business Profit" 
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
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

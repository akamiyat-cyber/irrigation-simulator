export interface Farmer {
  id: string;
  name: string;
  area: number | string;
}

export interface SimulationParams {
  fee: number | string;
  farmers: Farmer[];
  pumpOwnerArea: number | string;
  doesPumpOwnerPayFee: boolean;
  pumpOwnerFee: number | string;
  areaUnit: 'bigha' | 'ha';
  electricity: number | string;
  laborCost: number | string;
  otherCost: number | string;
  waterReductionRate: number | string;
  returnRate: number;
}
import React from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { SimulationParams } from '../types';

interface InputFormProps {
  params: SimulationParams;
  onChange: (key: keyof SimulationParams | Partial<SimulationParams>, value?: any) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ params, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '') {
      onChange(name as keyof SimulationParams, '');
    } else {
      onChange(name as keyof SimulationParams, Number(value));
    }
  };

  const handleUnitToggle = (newUnit: 'bigha' | 'ha') => {
    if (newUnit === params.areaUnit) return;
    
    const bighaToHa = 0.134;
    
    let newPumpOwnerArea = Number(params.pumpOwnerArea) || 0;
    let newFee = Number(params.fee) || 0;
    let newPumpOwnerFee = Number(params.pumpOwnerFee) || 0;
    let newFarmers = [...params.farmers];

    if (newUnit === 'ha') {
      newPumpOwnerArea = newPumpOwnerArea * bighaToHa;
      newFee = newFee / bighaToHa;
      newPumpOwnerFee = newPumpOwnerFee / bighaToHa;
      newFarmers = newFarmers.map(f => ({ ...f, area: Number(((Number(f.area) || 0) * bighaToHa).toFixed(3)) }));
    } else {
      newPumpOwnerArea = newPumpOwnerArea / bighaToHa;
      newFee = newFee * bighaToHa;
      newPumpOwnerFee = newPumpOwnerFee * bighaToHa;
      newFarmers = newFarmers.map(f => ({ ...f, area: Number(((Number(f.area) || 0) / bighaToHa).toFixed(3)) }));
    }

    onChange({
      farmers: newFarmers,
      pumpOwnerArea: Number(newPumpOwnerArea.toFixed(3)),
      fee: Math.round(newFee),
      pumpOwnerFee: Math.round(newPumpOwnerFee),
      areaUnit: newUnit
    });
  };

  const handleAddFarmer = () => {
    const newId = Date.now().toString();
    onChange('farmers', [
      ...params.farmers,
      { id: newId, name: `Farmer ${params.farmers.length + 1}`, area: 5 }
    ]);
  };

  const handleRemoveFarmer = (id: string) => {
    if (params.farmers.length <= 1) return; // Keep at least one
    onChange('farmers', params.farmers.filter(f => f.id !== id));
  };

  const handleFarmerChange = (id: string, field: 'name' | 'area', value: string | number) => {
    const updated = params.farmers.map(f => {
      if (f.id === id) {
        return { ...f, [field]: value };
      }
      return f;
    });
    onChange('farmers', updated);
  };

  // Component implementation

  return (
    <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-slate-100/50">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
        </span>
        Simulation Settings
      </h2>

      <div className="space-y-5">
        <div className="flex items-center space-x-4 mb-2">
          <label className="text-sm font-medium text-slate-600">Area Unit:</label>
          <div className="flex bg-slate-200 rounded-lg p-1">
            <button
              onClick={() => handleUnitToggle('bigha')}
              className={`px-4 py-1 text-sm rounded-md transition-colors ${params.areaUnit === 'bigha' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            >
              bigha
            </button>
            <button
              onClick={() => handleUnitToggle('ha')}
              className={`px-4 py-1 text-sm rounded-md transition-colors ${params.areaUnit === 'ha' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ha
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-600">
              Irrigation water fee paid by farmer <span className="text-slate-400 font-normal">(taka/season/{params.areaUnit})</span>
            </label>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{params.fee}</span>
          </div>
          <div className="flex flex-col gap-3">
            <input
              type="number"
              name="fee"
              value={params.fee}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
            <input
              type="range"
              name="fee"
              min="0"
              max="5000"
              step="50"
              value={params.fee}
              onChange={handleChange}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        <div className="pt-4 pb-2 border-t border-b border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-semibold text-slate-700">
              Farmers List
            </label>
            <button 
              onClick={handleAddFarmer}
              className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
            >
              <PlusCircle className="w-3 h-3 mr-1" />
              Add Farmer
            </button>
          </div>
          
          <div className="space-y-3">
            {params.farmers.map((farmer) => (
              <div key={farmer.id} className="flex gap-2 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                <input
                  type="text"
                  value={farmer.name}
                  onChange={(e) => handleFarmerChange(farmer.id, 'name', e.target.value)}
                  className="w-1/2 px-3 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none"
                  placeholder="Farmer Name"
                />
                <div className="w-1/2 relative">
                  <input
                    type="number"
                    value={farmer.area}
                    onChange={(e) => handleFarmerChange(farmer.id, 'area', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none"
                    placeholder="Area"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-slate-400 pointer-events-none">{params.areaUnit}</span>
                </div>
                {params.farmers.length > 1 && (
                  <button 
                    onClick={() => handleRemoveFarmer(farmer.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove farmer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-4 pt-2">
          <div className="space-y-1 w-1/2">
            <label className="block text-sm font-medium text-slate-600">
              Pump Owner's area <span className="text-slate-400 font-normal">({params.areaUnit})</span>
            </label>
            <input
              type="number"
              name="pumpOwnerArea"
              value={params.pumpOwnerArea}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>
          <div className="space-y-1 w-1/2 flex flex-col justify-end">
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-600 cursor-pointer pb-2">
              <input 
                type="checkbox" 
                checked={params.doesPumpOwnerPayFee} 
                onChange={(e) => onChange('doesPumpOwnerPayFee', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>Owner pays fee too?</span>
            </label>
            {params.doesPumpOwnerPayFee && (
              <div className="relative">
                <input
                  type="number"
                  name="pumpOwnerFee"
                  value={params.pumpOwnerFee}
                  onChange={handleChange}
                  placeholder={`Fee`}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-bold text-slate-700">Pump Business Expenses (Taka/season)</h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Total Cost: {(Number(params.electricity) || 0) + (Number(params.laborCost) || 0) + (Number(params.otherCost) || 0)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 relative">
              <label className="block text-xs font-medium text-slate-600">Electricity Bill</label>
              <input
                type="number"
                name="electricity"
                value={params.electricity}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
              />
            </div>
            <div className="space-y-1 relative">
              <label className="block text-xs font-medium text-slate-600">Labor Cost</label>
              <input
                type="number"
                name="laborCost"
                value={params.laborCost}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
              />
            </div>
            <div className="space-y-1 relative">
              <label className="block text-xs font-medium text-slate-600">Other Costs</label>
              <input
                type="number"
                name="otherCost"
                value={params.otherCost}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-600">
              Irrigation water reduction rate <span className="text-slate-400 font-normal">(%)</span>
            </label>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{params.waterReductionRate}%</span>
          </div>
          <input
            type="range"
            name="waterReductionRate"
            min="0"
            max="100"
            step="1"
            value={params.waterReductionRate}
            onChange={handleChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
          />
        </div>

        <div className="space-y-1 pt-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-600">
              Profit return rate to farmers <span className="text-slate-400 font-normal">(%)</span>
            </label>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{params.returnRate}%</span>
          </div>
          <input
            type="range"
            name="returnRate"
            min="0"
            max="100"
            step="1"
            value={params.returnRate}
            onChange={(e) => onChange('returnRate', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
          />
        </div>
      </div>
    </div>
  );
};
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
  const { chartData, stats } = useMemo(() => {
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

    // Calculate current revenue and expenses for the dashboard
    let currentRevenue = 0;
    let currentExpenses = 0;
    if (doesOwnerPay) {
      currentRevenue = totalCollectedFees * (1 - ((Number(params.returnRate) || 0) / 100));
      currentExpenses = totalExpenses;
    } else {
      currentRevenue = totalFeeFromFarmers * (1 - ((Number(params.returnRate) || 0) / 100));
      currentExpenses = farmerShareExpenses;
    }

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
    return {
      chartData: data,
      stats: {
        baselinePumpBusinessProfit,
        maxReturnRate,
        maxDiscountAmount,
        currentDiscountAmount,
        currentRevenue,
        currentExpenses,
        fee
      }
    };
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
            {Math.round(stats.currentDiscountAmount).toLocaleString()} <span className="text-sm font-normal">Taka/{params.areaUnit}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            New Fee: <span className="font-semibold text-slate-700">{Math.round(stats.fee - stats.currentDiscountAmount).toLocaleString()}</span> Taka
          </p>
        </div>
        <div className="hidden md:block w-px h-16 bg-blue-200"></div>
        <div className="text-sm text-center md:text-left flex-1">
          <p className="text-slate-600 mb-1 font-medium">
            Pump Business (at {params.returnRate}%):
          </p>
          <div className="flex flex-col gap-0.5 text-xs max-w-[200px] mx-auto md:mx-0">
            <div className="flex justify-between">
              <span className="text-slate-500">Revenue:</span>
              <span className="font-semibold text-slate-700">{Math.round(stats.currentRevenue).toLocaleString()} Taka</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expenses:</span>
              <span className="font-semibold text-slate-700">-{Math.round(stats.currentExpenses).toLocaleString()} Taka</span>
            </div>
            <div className="flex justify-between border-t border-blue-200 mt-1 pt-1">
              <span className="font-bold text-slate-700">Net Profit:</span>
              <span className="font-bold text-indigo-700">{Math.round(currentData.pumpBusinessProfit as number).toLocaleString()} Taka</span>
            </div>
          </div>
        </div>
        <div className="hidden md:block w-px h-16 bg-blue-200"></div>
        <div className="text-sm text-center md:text-left flex-1">
          <p className="text-slate-600 mb-1 font-medium flex items-center justify-center md:justify-start gap-1">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Max Win-Win Discount (Owner keeps baseline profit):
          </p>
          <p className="font-bold text-emerald-700 text-2xl">
            {Math.round(stats.maxDiscountAmount).toLocaleString()} <span className="text-sm font-normal">Taka/{params.areaUnit}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Max Return Rate: <span className="font-semibold text-slate-700">{Math.max(0, (Math.floor(stats.maxReturnRate * 10) / 10))}%</span>
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
              y={stats.baselinePumpBusinessProfit} 
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
import { useState } from 'react';
import { InputForm } from './components/InputForm';
import { SimulationChart } from './components/SimulationChart';
import type { SimulationParams } from './types';

const INITIAL_FARMERS = [
  { id: '1', name: 'Farmer A', area: 10 },
  { id: '2', name: 'Farmer B', area: 5 }
];

const INITIAL_PARAMS: SimulationParams = {
  fee: 1800,
  farmers: INITIAL_FARMERS,
  pumpOwnerArea: 10,
  doesPumpOwnerPayFee: false,
  pumpOwnerFee: 1800,
  areaUnit: 'bigha',
  electricity: 15000,
  laborCost: 5000,
  otherCost: 2000,
  waterReductionRate: 20,
  returnRate: 50,
};

function App() {
  const [params, setParams] = useState<SimulationParams>(INITIAL_PARAMS);
  const [paramsB, setParamsB] = useState<SimulationParams>(INITIAL_PARAMS);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const handleParamChange = (key: keyof SimulationParams | Partial<SimulationParams>, value?: any) => {
    if (typeof key === 'string') {
      setParams(prev => ({ ...prev, [key]: value }));
    } else {
      setParams(prev => ({ ...prev, ...key }));
    }
  };

  const handleParamChangeB = (key: keyof SimulationParams | Partial<SimulationParams>, value?: any) => {
    if (typeof key === 'string') {
      setParamsB(prev => ({ ...prev, [key]: value }));
    } else {
      setParamsB(prev => ({ ...prev, ...key }));
    }
  };

  const toggleCompareMode = () => {
    if (!isCompareMode) {
      setParamsB(JSON.parse(JSON.stringify(params)));
    }
    setIsCompareMode(!isCompareMode);
  };

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-transparent -z-10 pointer-events-none print:hidden" />
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -z-10 pointer-events-none print:hidden" />
      <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl -z-10 pointer-events-none print:hidden" />

      <div className="max-w-6xl mx-auto px-4 py-12 print:py-4 print:max-w-none">
        <header className="mb-12 print:mb-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 print:text-black mb-4 tracking-tight">
            Irrigation Water Reduction Simulator
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            Explore how water savings translate to economic benefits and equitable profit distribution among farmers and pump owners.
          </p>
          <button
            onClick={toggleCompareMode}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all shadow-sm print:hidden ${isCompareMode ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
            {isCompareMode ? 'Disable Comparison' : 'Compare Scenarios'}
          </button>
        </header>

        {isCompareMode ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12 print:mb-4 print:block">
            {/* Scenario A */}
            <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100">
              <h2 className="text-2xl font-bold text-center text-blue-800 mb-6 flex items-center justify-center gap-2">
                <span className="bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm">Scenario A</span>
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <InputForm params={params} onChange={handleParamChange} />
                </div>
                <div className="print:w-full print:block">
                  <SimulationChart params={params} />
                </div>
              </div>
            </div>

            {/* Scenario B */}
            <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100">
              <h2 className="text-2xl font-bold text-center text-emerald-800 mb-6 flex items-center justify-center gap-2">
                <span className="bg-emerald-200 text-emerald-700 px-3 py-1 rounded-lg text-sm">Scenario B</span>
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <InputForm params={paramsB} onChange={handleParamChangeB} />
                </div>
                <div className="print:w-full print:block">
                  <SimulationChart params={paramsB} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12 print:mb-4 print:block max-w-6xl mx-auto">
            <div className="lg:col-span-4">
              <InputForm params={params} onChange={handleParamChange} />
            </div>
            <div className="lg:col-span-8 print:w-full print:block">
              <SimulationChart params={params} />
            </div>
          </div>
        )}

        {/* Calculation Formulas Section */}
        {!isCompareMode && (
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-slate-200/60 shadow-sm max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            </span>
            Calculation Formulas
          </h3>
          
          <div className="space-y-8 text-slate-600">
            {params.doesPumpOwnerPayFee ? (
              // Logic when owner pays fee
              <>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 text-lg border-b border-slate-200 pb-2">1. Base Variables (Owner Pays Fee)</h4>
                  <ul className="space-y-3 ml-2">
                    <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="font-medium text-slate-700 min-w-[220px]">Total Collected Fees</span>
                      <code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Sum of (Farmer's Area × Fee) + (Owner's Area × Owner's Fee)</code>
                    </li>
                    <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="font-medium text-slate-700 min-w-[220px]">Total Expenses</span>
                      <code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Electricity + Labor Cost + Other Cost</code>
                    </li>
                    <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="font-medium text-slate-700 min-w-[220px]">New Total Expenses</span>
                      <code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= {`{Electricity × (1 - Water Reduction Rate / 100)}`} + Labor Cost + Other Cost</code>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 text-lg border-b border-slate-200 pb-2">2. Profit Calculations</h4>
                  <ul className="space-y-4 ml-2">
                    <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                      <span className="block font-bold text-emerald-800 mb-2">🧑‍🌾 Farmer's Profit (Discount)</span>
                      <code className="bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-sm block overflow-x-auto">
                        = (Fee × Individual Area) × (Return Rate / 100)
                      </code>
                    </li>
                    <li className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                      <span className="block font-bold text-slate-700 mb-2">👤 Owner's Farmer Discount</span>
                      <code className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm block overflow-x-auto">
                        = (Owner's Fee × Owner's Area) × (Return Rate / 100)
                      </code>
                    </li>
                    <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <span className="block font-bold text-indigo-800 mb-2">⚙️ Pump Business Profit</span>
                      <code className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm block overflow-x-auto">
                        = {`{ Total Collected Fees × (1 - Return Rate / 100) }`} - New Total Expenses
                      </code>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              // Old logic when owner does not pay fee
              <>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 text-lg border-b border-slate-200 pb-2">1. Base Variables</h4>
                  <ul className="space-y-3 ml-2">
                    <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="font-medium text-slate-700 min-w-[220px]">Total Area</span>
                      <code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Sum of all Farmers' areas + Pump Owner's area</code>
                    </li>
                    <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="font-medium text-slate-700 min-w-[220px]">Total Fee from all Farmers</span>
                      <code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Fee × Sum of all Farmers' areas</code>
                    </li>
                    <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="font-medium text-slate-700 min-w-[220px]">Total Expenses</span>
                      <code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Electricity + Labor Cost + Other Cost</code>
                    </li>
                    <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="font-medium text-slate-700 min-w-[220px]">Farmers' Expenses Share</span>
                      <code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Total Expenses × (Sum of all Farmers' areas / Total Area)</code>
                    </li>
                    <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="font-medium text-slate-700 min-w-[220px]">New Total Expenses</span>
                      <code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= {`{Electricity × (1 - Water Reduction Rate / 100)}`} + Labor Cost + Other Cost</code>
                    </li>
                    <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="font-medium text-slate-700 min-w-[220px]">New Expenses (Farmers' Share)</span>
                      <code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= New Total Expenses × (Sum of all Farmers' areas / Total Area)</code>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 text-lg border-b border-slate-200 pb-2">2. Profit Calculations</h4>
                  <ul className="space-y-4 ml-2">
                    <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                      <span className="block font-bold text-emerald-800 mb-2">🧑‍🌾 Individual Farmer's Profit</span>
                      <code className="bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-sm block overflow-x-auto">
                        = (Fee × Individual Farmer's area) × (Return Rate / 100)
                      </code>
                    </li>
                    <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <span className="block font-bold text-indigo-800 mb-2">⚙️ Pump Owner's Profit</span>
                      <code className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm block overflow-x-auto">
                        = {`{ Total Fee from all Farmers × (1 - Return Rate / 100) }`} - New Expenses (Farmers' Share)
                      </code>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default App;

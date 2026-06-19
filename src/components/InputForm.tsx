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

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-600">
            Irrigation water fee paid by farmer <span className="text-slate-400 font-normal">(taka/season/{params.areaUnit})</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              name="fee"
              value={params.fee}
              onChange={handleChange}
              className="w-1/3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
            <input
              type="range"
              name="fee"
              min="0"
              max="5000"
              step="50"
              value={params.fee}
              onChange={handleChange}
              className="w-2/3 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
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

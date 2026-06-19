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

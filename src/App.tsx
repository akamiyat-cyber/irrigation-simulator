import React, { useState, useMemo } from 'react';
import {
  PlusCircle, Trash2, Droplets, Zap, PiggyBank,
  ArrowRight, TrendingUp, SlidersHorizontal, Users
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

/* ============================================================
   Types
   ============================================================ */

interface Farmer {
  id: string;
  name: string;
  area: number | string;
}

type AreaUnit = 'bigha' | 'ha';
type Language = 'en' | 'bn';
type Mode = 'simple' | 'detailed';

interface SimulationParams {
  fee: number | string;
  farmers: Farmer[];
  pumpOwnerArea: number | string;
  doesPumpOwnerPayFee: boolean;
  pumpOwnerFee: number | string;
  areaUnit: AreaUnit;
  electricity: number | string;
  laborCost: number | string;
  otherCost: number | string;
  waterReductionRate: number | string;
  returnRate: number;
}

interface BaseCalc {
  fee: number;
  pumpOwnerArea: number;
  doesOwnerPay: boolean;
  ownerFee: number;
  totalFarmerArea: number;
  totalArea: number;
  farmerShareRatio: number;
  totalFeeFromFarmers: number;
  totalCollectedFees: number;
  electricity: number;
  laborCost: number;
  otherCost: number;
  newTotalElectricityCost: number;
  newFarmerElectricityCost: number;
  totalExpenses: number;
  farmerShareExpenses: number;
  baselinePumpBusinessProfit: number;
  savings: number;
  maxReturnRate: number;
  maxDiscountAmount: number;
}

interface PointResult {
  returnRate: number;
  farmerProfits: Record<string, number>;
  ownerFarmerProfit: number;
  pumpBusinessProfit: number;
}

interface ChartPoint {
  returnRate: number;
  [key: string]: number;
}

type Translation = Record<string, string>;

/* ============================================================
   Shared calculation logic (used by BOTH Simple & Detailed views
   so the numbers always match between tabs)
   ============================================================ */

function getBaseCalc(params: SimulationParams): BaseCalc {
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

  const electricity = Number(params.electricity) || 0;
  const laborCost = Number(params.laborCost) || 0;
  const otherCost = Number(params.otherCost) || 0;

  const newTotalElectricityCost = electricity * (1 - waterReductionRate / 100);
  const newFarmerElectricityCost = (electricity * farmerShareRatio) * (1 - waterReductionRate / 100);

  const totalExpenses = newTotalElectricityCost + laborCost + otherCost;
  const farmerShareExpenses = newFarmerElectricityCost + ((laborCost + otherCost) * farmerShareRatio);

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

  return {
    fee, pumpOwnerArea, doesOwnerPay, ownerFee,
    totalFarmerArea, totalArea, farmerShareRatio,
    totalFeeFromFarmers, totalCollectedFees,
    electricity, laborCost, otherCost,
    newTotalElectricityCost, newFarmerElectricityCost,
    totalExpenses, farmerShareExpenses,
    baselinePumpBusinessProfit, savings, maxReturnRate, maxDiscountAmount,
  };
}

function getPointAt(base: BaseCalc, params: SimulationParams, r: number): PointResult {
  const farmerProfits: Record<string, number> = {};
  params.farmers.forEach((farmer) => {
    const area = Number(farmer.area) || 0;
    const farmerFeeAmount = base.fee * area;
    farmerProfits[farmer.id] = farmerFeeAmount * (r / 100);
  });

  let ownerFarmerProfit = 0;
  let pumpBusinessProfit = 0;

  if (base.doesOwnerPay) {
    const ownerFeeAmount = base.ownerFee * base.pumpOwnerArea;
    ownerFarmerProfit = ownerFeeAmount * (r / 100);
    pumpBusinessProfit = base.totalCollectedFees * (1 - r / 100) - base.totalExpenses;
  } else {
    pumpBusinessProfit = base.totalFeeFromFarmers * (1 - r / 100) - base.farmerShareExpenses;
  }

  return { returnRate: r, farmerProfits, ownerFarmerProfit, pumpBusinessProfit };
}

function buildChartData(base: BaseCalc, params: SimulationParams): ChartPoint[] {
  const data: ChartPoint[] = [];
  for (let r = 0; r <= 100; r += 1) {
    const pt = getPointAt(base, params, r);
    const point: ChartPoint = { returnRate: r };
    params.farmers.forEach((f) => { point[`farmer_${f.id}`] = Math.round(pt.farmerProfits[f.id]); });
    if (base.doesOwnerPay) point.ownerFarmerProfit = Math.round(pt.ownerFarmerProfit);
    point.pumpBusinessProfit = Math.round(pt.pumpBusinessProfit);
    data.push(point);
  }
  return data;
}

function convertUnits(prev: SimulationParams, newUnit: AreaUnit): SimulationParams {
  if (newUnit === prev.areaUnit) return prev;
  const bighaToHa = 0.134;
  let newPumpOwnerArea = Number(prev.pumpOwnerArea) || 0;
  let newFee = Number(prev.fee) || 0;
  let newPumpOwnerFee = Number(prev.pumpOwnerFee) || 0;
  let newFarmers: Farmer[] = prev.farmers.map((f) => ({ ...f }));

  if (newUnit === 'ha') {
    newPumpOwnerArea *= bighaToHa;
    newFee /= bighaToHa;
    newPumpOwnerFee /= bighaToHa;
    newFarmers = newFarmers.map((f) => ({ ...f, area: Number(((Number(f.area) || 0) * bighaToHa).toFixed(3)) }));
  } else {
    newPumpOwnerArea /= bighaToHa;
    newFee *= bighaToHa;
    newPumpOwnerFee *= bighaToHa;
    newFarmers = newFarmers.map((f) => ({ ...f, area: Number(((Number(f.area) || 0) / bighaToHa).toFixed(3)) }));
  }

  return {
    ...prev,
    farmers: newFarmers,
    pumpOwnerArea: Number(newPumpOwnerArea.toFixed(3)),
    fee: Math.round(newFee),
    pumpOwnerFee: Math.round(newPumpOwnerFee),
    areaUnit: newUnit,
  };
}

const FARMER_COLORS: string[] = ['#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#eab308', '#ef4444'];

/* ============================================================
   Translations (Simple mode UI only — Detailed mode stays English
   for policy / research reporting consistency)
   ============================================================ */

const translations: Record<Language, Translation> = {
  en: {
    appTitle: '3F4D Water Saving Calculator',
    appSubtitle: 'See how saving water can benefit both farmers and the pump owner',
    simpleTab: 'Simple',
    detailedTab: 'Detailed',
    setupTitle: 'Farm Setup',
    areaUnit: 'Area unit',
    bigha: 'bigha',
    ha: 'ha',
    feeLabel: 'Irrigation fee (per season, per',
    farmersList: 'Farmers',
    addFarmer: 'Add Farmer',
    farmerDefaultName: 'Farmer',
    farmerNamePlaceholder: 'Farmer name',
    pumpOwnerAreaLabel: "Pump owner's own area",
    advancedToggleShow: 'Show pump cost details',
    advancedToggleHide: 'Hide pump cost details',
    electricity: 'Electricity bill',
    laborCost: 'Labor cost',
    otherCost: 'Other costs',
    ownerPaysFee: 'Pump owner also pays the fee',
    ownerFeeLabel: "Owner's fee",
    step1Title: 'Step 1 — How much water will you save?',
    waterSavingLabel: 'Water & electricity saving',
    step2Title: 'Step 2 — Pump electricity savings',
    perSeason: 'per season',
    step3Title: 'Step 3 — How much will you share with farmers?',
    shareLabel: 'Share with farmers',
    winWinMax: 'Win-win maximum',
    setToMax: 'Use win-win max',
    step4Title: 'Step 4 — Results',
    discount: 'Discount',
    newFeeLabel: 'New fee',
    originalFee: 'Original fee',
    pumpOwnerProfitLabel: "Pump owner's profit",
    sameAsBefore: 'Protected — same as before',
    changedBy: 'vs. before water saving',
    moneyFlowTitle: 'Where does the saved money go?',
    totalSavings: 'Total savings',
    sharedWithFarmers: 'Shared with farmers',
    keptByOwner: 'Kept by pump owner',
    taka: 'Taka',
    ownerAsFarmer: 'Owner (as a farmer)',
    formulaLabel: 'Calculation Formula',
    printPdf: 'Save as PDF / Print',
  },
  bn: {
    appTitle: '৩F৪D পানি সাশ্রয় ক্যালকুলেটর',
    appSubtitle: 'পানি সাশ্রয় কীভাবে কৃষক ও পাম্প মালিক দুজনকেই লাভবান করে তা দেখুন',
    simpleTab: 'সহজ',
    detailedTab: 'বিস্তারিত',
    setupTitle: 'জমির তথ্য',
    areaUnit: 'জমির একক',
    bigha: 'বিঘা',
    ha: 'হেক্টর',
    feeLabel: 'সেচ মাশুল (প্রতি সিজন, প্রতি',
    farmersList: 'কৃষকগণ',
    addFarmer: 'কৃষক যুক্ত করুন',
    farmerDefaultName: 'কৃষক',
    farmerNamePlaceholder: 'কৃষকের নাম',
    pumpOwnerAreaLabel: 'পাম্প মালিকের নিজের জমি',
    advancedToggleShow: 'পাম্প খরচের বিস্তারিত দেখান',
    advancedToggleHide: 'পাম্প খরচের বিস্তারিত লুকান',
    electricity: 'বিদ্যুৎ বিল',
    laborCost: 'শ্রম খরচ',
    otherCost: 'অন্যান্য খরচ',
    ownerPaysFee: 'পাম্প মালিকও মাশুল দেন',
    ownerFeeLabel: 'মালিকের মাশুল',
    step1Title: 'ধাপ ১ — আপনি কত পানি সাশ্রয় করবেন?',
    waterSavingLabel: 'পানি ও বিদ্যুৎ সাশ্রয়',
    step2Title: 'ধাপ ২ — পাম্পের বিদ্যুৎ সাশ্রয়',
    perSeason: 'প্রতি সিজন',
    step3Title: 'ধাপ ৩ — কৃষকদের সাথে কতটা ভাগ করবেন?',
    shareLabel: 'কৃষকদের সাথে ভাগ',
    winWinMax: 'সর্বোচ্চ পারস্পরিক লাভজনক হার',
    setToMax: 'সর্বোচ্চ হার ব্যবহার করুন',
    step4Title: 'ধাপ ৪ — ফলাফল',
    discount: 'ছাড়',
    newFeeLabel: 'নতুন মাশুল',
    originalFee: 'পূর্বের মাশুল',
    pumpOwnerProfitLabel: 'পাম্প মালিকের লাভ',
    sameAsBefore: 'সুরক্ষিত — আগের মতোই',
    changedBy: 'পানি সাশ্রয়ের আগের তুলনায়',
    moneyFlowTitle: 'সাশ্রয়ী টাকা কোথায় যায়?',
    totalSavings: 'মোট সাশ্রয়',
    sharedWithFarmers: 'কৃষকদের সাথে ভাগ করা',
    keptByOwner: 'পাম্প মালিকের কাছে রাখা',
    taka: 'টাকা',
    ownerAsFarmer: 'মালিক (কৃষক হিসেবে)',
    formulaLabel: 'হিসাবের সূত্র',
    printPdf: 'পিডিএফ হিসেবে সেভ / প্রিন্ট করুন',
  },
};

/* ============================================================
   Shared small components
   ============================================================ */

interface FarmerEditorProps {
  farmers: Farmer[];
  areaUnit: AreaUnit;
  setFarmers: (farmers: Farmer[]) => void;
  t: Translation;
  large?: boolean;
}

const FarmerEditor: React.FC<FarmerEditorProps> = ({ farmers, areaUnit, setFarmers, t, large }) => {
  const handleAdd = () => {
    const newId = Date.now().toString();
    setFarmers([...farmers, { id: newId, name: `${t.farmerDefaultName} ${farmers.length + 1}`, area: 5 }]);
  };
  const handleRemove = (id: string) => {
    if (farmers.length <= 1) return;
    setFarmers(farmers.filter((f) => f.id !== id));
  };
  const handleFieldChange = (id: string, field: 'name' | 'area', value: string | number) => {
    setFarmers(farmers.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className={`font-semibold text-slate-700 flex items-center gap-2 ${large ? 'text-lg' : 'text-sm'}`}>
          <Users className={large ? 'w-5 h-5 text-blue-500' : 'w-4 h-4 text-blue-500'} />
          {t.farmersList}
        </span>
        <button
          onClick={handleAdd}
          className={`flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors ${large ? 'text-sm px-3 py-2' : 'text-xs px-2 py-1'}`}
        >
          <PlusCircle className={large ? 'w-4 h-4' : 'w-3 h-3'} />
          {t.addFarmer}
        </button>
      </div>
      <div className="space-y-2">
        {farmers.map((farmer) => (
          <div key={farmer.id} className={`flex gap-2 items-center bg-slate-50 rounded-xl border border-slate-200 ${large ? 'p-3' : 'p-2'}`}>
            <input
              type="text"
              value={farmer.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(farmer.id, 'name', e.target.value)}
              className={`flex-1 min-w-0 bg-white border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${large ? 'px-3 py-2 text-base' : 'px-2 py-1 text-sm'}`}
              placeholder={t.farmerNamePlaceholder}
            />
            <div className="relative w-28 shrink-0">
              <input
                type="number"
                value={farmer.area}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(farmer.id, 'area', e.target.value === '' ? '' : Number(e.target.value))}
                className={`w-full bg-white border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${large ? 'px-3 py-2 pr-12 text-base' : 'px-2 py-1 pr-10 text-sm'}`}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">{areaUnit}</span>
            </div>
            {farmers.length > 1 && (
              <button
                onClick={() => handleRemove(farmer.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                title="Remove"
              >
                <Trash2 className={large ? 'w-5 h-5' : 'w-4 h-4'} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface UnitToggleProps {
  areaUnit: AreaUnit;
  onToggle: (unit: AreaUnit) => void;
  t: Translation;
  large?: boolean;
}

const UnitToggle: React.FC<UnitToggleProps> = ({ areaUnit, onToggle, t, large }) => {
  return (
    <div className="flex items-center gap-3">
      <label className={`font-medium text-slate-600 ${large ? 'text-base' : 'text-sm'}`}>{t.areaUnit}:</label>
      <div className="flex bg-slate-200 rounded-lg p-1">
        <button
          onClick={() => onToggle('bigha')}
          className={`rounded-md transition-colors font-bold ${large ? 'px-4 py-1.5 text-base' : 'px-3 py-1 text-sm'} ${areaUnit === 'bigha' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {t.bigha}
        </button>
        <button
          onClick={() => onToggle('ha')}
          className={`rounded-md transition-colors font-bold ${large ? 'px-4 py-1.5 text-base' : 'px-3 py-1 text-sm'} ${areaUnit === 'ha' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {t.ha}
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   SIMPLE MODE — story-based, for extension officers ↔ farmers
   ============================================================ */

interface SimpleViewProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  language: Language;
  t: Translation;
}

const SimpleView: React.FC<SimpleViewProps> = ({ params, setParams, t }) => {
  const base = useMemo(() => getBaseCalc(params), [params]);
  const r = Number(params.returnRate) || 0;
  const currentPoint = useMemo(() => getPointAt(base, params, r), [base, params, r]);

  const setField = (field: keyof SimulationParams, value: any) => {
    setParams((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'waterReductionRate') {
        const tempBase = getBaseCalc(next);
        next.returnRate = Math.max(0, Math.floor(tempBase.maxReturnRate * 10) / 10);
      }
      return next;
    });
  };
  const setFarmers = (farmers: Farmer[]) => setParams((prev) => ({ ...prev, farmers }));
  const handleUnitToggle = (newUnit: AreaUnit) => setParams((prev) => convertUnits(prev, newUnit));

  const totalGivenBack =
    Object.values(currentPoint.farmerProfits).reduce((s, v) => s + v, 0) +
    (base.doesOwnerPay ? currentPoint.ownerFarmerProfit : 0);
  const keptByOwner = base.savings - totalGivenBack;
  const ownerProfitDelta = currentPoint.pumpBusinessProfit - base.baselinePumpBusinessProfit;
  const newUnitFee = base.fee * (1 - r / 100);

  const fmt = (n: number) => Math.round(n).toLocaleString();

  return (
    <div className="space-y-5">
      {/* Setup */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">{t.setupTitle}</h2>
        <div className="space-y-4">
          <UnitToggle areaUnit={params.areaUnit} onToggle={handleUnitToggle} t={t} large />

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              {t.feeLabel} {params.areaUnit})
            </label>
            <input
              type="number"
              value={params.fee}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('fee', e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <FarmerEditor farmers={params.farmers} areaUnit={params.areaUnit} setFarmers={setFarmers} t={t} large />

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{t.pumpOwnerAreaLabel} ({params.areaUnit})</label>
            <input
              type="number"
              value={params.pumpOwnerArea}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('pumpOwnerArea', e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t.electricity}</label>
                <input type="number" value={params.electricity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('electricity', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t.laborCost}</label>
                <input type="number" value={params.laborCost} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('laborCost', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t.otherCost}</label>
                <input type="number" value={params.otherCost} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('otherCost', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
              <input type="checkbox" checked={params.doesPumpOwnerPayFee}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('doesPumpOwnerPayFee', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              <span>{t.ownerPaysFee}</span>
            </label>
            {params.doesPumpOwnerPayFee && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t.ownerFeeLabel}</label>
                <input type="number" value={params.pumpOwnerFee} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('pumpOwnerFee', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>
      </div>

      {/* Step 1 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <span className="bg-cyan-100 text-cyan-600 p-2 rounded-lg"><Droplets className="w-5 h-5" /></span>
          {t.step1Title}
        </h3>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm text-slate-500">{t.waterSavingLabel}</span>
          <span className="text-3xl font-extrabold text-cyan-600">{params.waterReductionRate}%</span>
        </div>
        <input
          type="range" min={0} max={100} step={1}
          value={params.waterReductionRate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('waterReductionRate', Number(e.target.value))}
          className="w-full h-3 bg-cyan-100 rounded-lg appearance-none cursor-pointer accent-cyan-600"
        />
      </div>

      {/* Step 2 */}
      <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-5 border border-amber-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <span className="bg-amber-100 text-amber-600 p-2 rounded-lg"><Zap className="w-5 h-5" /></span>
          {t.step2Title}
        </h3>
        <div className="text-4xl font-extrabold text-amber-600">
          {fmt(base.savings)} <span className="text-base font-normal text-slate-500">{t.taka} / {t.perSeason}</span>
        </div>
        <div className="mt-3 bg-white/50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800">
          <div className="font-semibold mb-1">{t.formulaLabel}:</div>
          {params.doesPumpOwnerPayFee ? (
            <code className="block bg-amber-100/50 px-2 py-1.5 rounded text-amber-900 overflow-x-auto whitespace-nowrap">
              {fmt(Number(params.electricity) || 0)} × {params.waterReductionRate}% = {fmt(base.savings)}
            </code>
          ) : (
            <code className="block bg-amber-100/50 px-2 py-1.5 rounded text-amber-900 overflow-x-auto whitespace-nowrap">
              {fmt(Number(params.electricity) || 0)} × ({fmt(base.totalFarmerArea)} / {fmt(base.totalArea)}) × {params.waterReductionRate}% = {fmt(base.savings)}
            </code>
          )}
        </div>
      </div>

      {/* Step 3 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><Users className="w-5 h-5" /></span>
          {t.step3Title}
        </h3>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm text-slate-500">{t.shareLabel}</span>
          <span className="text-3xl font-extrabold text-emerald-600">{r}%</span>
        </div>
        <input
          type="range" min={0} max={100} step={0.1}
          value={r}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('returnRate', Number(e.target.value))}
          className="w-full h-3 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-slate-400">
            {t.winWinMax}: <span className="font-semibold text-slate-600">{Math.max(0, Math.floor(base.maxReturnRate * 10) / 10)}%</span>
          </span>
          <button
            onClick={() => setField('returnRate', Math.max(0, Math.floor(base.maxReturnRate * 10) / 10))}
            className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors"
          >
            {t.setToMax}
          </button>
        </div>
      </div>

      {/* Money flow */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">{t.moneyFlowTitle}</h3>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <div className="text-xs text-amber-700 font-medium mb-1">{t.totalSavings}</div>
            <div className="text-xl font-extrabold text-amber-700">{fmt(base.savings)}</div>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-300 rotate-90 sm:rotate-0 shrink-0" />
          <div className="flex-1 w-full grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <div className="text-xs text-emerald-700 font-medium mb-1">{t.sharedWithFarmers}</div>
              <div className="text-lg font-extrabold text-emerald-700">{fmt(totalGivenBack)}</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
              <div className="text-xs text-indigo-700 font-medium mb-1">{t.keptByOwner}</div>
              <div className="text-lg font-extrabold text-indigo-700">{fmt(keptByOwner)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4 results */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 p-2 rounded-lg"><TrendingUp className="w-5 h-5" /></span>
          {t.step4Title}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {params.farmers.map((farmer, idx) => {
            const color = FARMER_COLORS[idx % FARMER_COLORS.length];
            const discount = currentPoint.farmerProfits[farmer.id] || 0;
            return (
              <div key={farmer.id} className="rounded-xl p-4 border-2" style={{ borderColor: color, backgroundColor: `${color}10` }}>
                <div className="font-bold text-slate-700 mb-2 truncate">{farmer.name} ({farmer.area} {params.areaUnit})</div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">{t.discount}</span>
                  <span className="font-bold" style={{ color }}>{fmt(discount)} {t.taka}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t.newFeeLabel}</span>
                  <span className="text-slate-600">{fmt(newUnitFee)} / {params.areaUnit}</span>
                </div>
              </div>
            );
          })}
          {params.doesPumpOwnerPayFee && (
            <div className="rounded-xl p-4 border-2 border-slate-300 bg-slate-50">
              <div className="font-bold text-slate-700 mb-2">{t.ownerAsFarmer}</div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{t.discount}</span>
                <span className="font-bold text-slate-600">{fmt(currentPoint.ownerFarmerProfit)} {t.taka}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><PiggyBank className="w-6 h-6" /></span>
            <span className="font-bold text-indigo-800">{t.pumpOwnerProfitLabel}</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-indigo-700">{fmt(currentPoint.pumpBusinessProfit)} {t.taka}</div>
            <div className="text-xs text-slate-500">
              {Math.abs(ownerProfitDelta) < 1 ? t.sameAsBefore : `${ownerProfitDelta >= 0 ? '+' : ''}${fmt(ownerProfitDelta)} ${t.taka} (${t.changedBy})`}
            </div>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="flex justify-center print:hidden mt-8 mb-4">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white hover:bg-slate-700 rounded-xl font-bold shadow-sm transition-colors">
          {t.printPdf}
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   DETAILED MODE — full data view for researchers / policy makers
   ============================================================ */

interface DetailedInputFormProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
}

const DetailedInputForm: React.FC<DetailedInputFormProps> = ({ params, setParams }) => {
  const setField = (field: keyof SimulationParams, value: any) => {
    setParams((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'waterReductionRate') {
        const tempBase = getBaseCalc(next);
        next.returnRate = Math.max(0, Math.floor(tempBase.maxReturnRate * 10) / 10);
      }
      return next;
    });
  };
  const setFarmers = (farmers: Farmer[]) => setParams((prev) => ({ ...prev, farmers }));
  const handleUnitToggle = (newUnit: AreaUnit) => setParams((prev) => convertUnits(prev, newUnit));

  return (
    <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-slate-100/50">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="bg-blue-100 text-blue-600 p-2 rounded-lg"><SlidersHorizontal className="w-5 h-5" /></span>
        Simulation Settings
      </h2>

      <div className="space-y-5">
        <UnitToggle areaUnit={params.areaUnit} onToggle={handleUnitToggle} t={{ areaUnit: 'Area Unit', bigha: 'bigha', ha: 'ha' }} />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-600">
              Irrigation water fee paid by farmer <span className="text-slate-400 font-normal">(taka/season/{params.areaUnit})</span>
            </label>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{params.fee}</span>
          </div>
          <input type="number" value={params.fee} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('fee', e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          <input type="range" min={0} max={5000} step={50} value={params.fee}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('fee', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </div>

        <div className="pt-4 pb-2 border-t border-b border-slate-100">
          <FarmerEditor farmers={params.farmers} areaUnit={params.areaUnit} setFarmers={setFarmers}
            t={{ farmersList: 'Farmers List', addFarmer: 'Add Farmer', farmerDefaultName: 'Farmer', farmerNamePlaceholder: 'Farmer Name' }} />
        </div>

        <div className="flex space-x-4 pt-2">
          <div className="space-y-1 w-1/2">
            <label className="block text-sm font-medium text-slate-600">Pump Owner's area <span className="text-slate-400 font-normal">({params.areaUnit})</span></label>
            <input type="number" value={params.pumpOwnerArea} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('pumpOwnerArea', e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="space-y-1 w-1/2 flex flex-col justify-end">
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-600 cursor-pointer pb-2">
              <input type="checkbox" checked={params.doesPumpOwnerPayFee} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('doesPumpOwnerPayFee', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              <span>Owner pays fee too?</span>
            </label>
            {params.doesPumpOwnerPayFee && (
              <input type="number" value={params.pumpOwnerFee} placeholder="Fee" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('pumpOwnerFee', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            )}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-bold text-slate-700">Pump Business Expenses (Taka/season)</h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              Total Cost: {(Number(params.electricity) || 0) + (Number(params.laborCost) || 0) + (Number(params.otherCost) || 0)}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Electricity Bill</label>
              <input type="number" value={params.electricity} placeholder="0" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('electricity', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Labor Cost</label>
              <input type="number" value={params.laborCost} placeholder="0" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('laborCost', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Other Costs</label>
              <input type="number" value={params.otherCost} placeholder="0" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('otherCost', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-600">Irrigation water reduction rate <span className="text-slate-400 font-normal">(%)</span></label>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{params.waterReductionRate}%</span>
          </div>
          <input type="range" min={0} max={100} step={1} value={params.waterReductionRate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('waterReductionRate', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2" />
        </div>

        <div className="space-y-1 pt-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-600">Profit return rate to farmers <span className="text-slate-400 font-normal">(%)</span></label>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{params.returnRate}%</span>
          </div>
          <input type="range" min={0} max={100} step={0.1} value={params.returnRate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('returnRate', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2" />
        </div>
      </div>
    </div>
  );
};

interface DetailedChartProps {
  params: SimulationParams;
}

const DetailedChart: React.FC<DetailedChartProps> = ({ params }) => {
  const base = useMemo(() => getBaseCalc(params), [params]);
  const chartData = useMemo(() => buildChartData(base, params), [base, params]);
  const r = Number(params.returnRate) || 0;

  const stats = useMemo(() => {
    let currentRevenue = 0;
    let currentExpenses = 0;
    if (base.doesOwnerPay) {
      currentRevenue = base.totalCollectedFees * (1 - r / 100);
      currentExpenses = base.totalExpenses;
    } else {
      currentRevenue = base.totalFeeFromFarmers * (1 - r / 100);
      currentExpenses = base.farmerShareExpenses;
    }
    return {
      baselinePumpBusinessProfit: base.baselinePumpBusinessProfit,
      maxReturnRate: base.maxReturnRate,
      maxDiscountAmount: base.maxDiscountAmount,
      currentDiscountAmount: base.fee * (r / 100),
      currentRevenue, currentExpenses, fee: base.fee,
    };
  }, [base, r]);

  const currentPoint = useMemo(() => getPointAt(base, params, r), [base, params, r]);

  const handleExportCSV = () => {
    const headers = ['Return Rate (%)'];
    params.farmers.forEach((f) => headers.push(`${f.name} Profit (Taka)`));
    if (params.doesPumpOwnerPayFee) headers.push("Owner's Farmer Discount (Taka)");
    headers.push('Pump Business Profit (Taka)');

    const rows = chartData.map((point) => {
      const row: (string | number)[] = [point.returnRate];
      params.farmers.forEach((f) => row.push(point[`farmer_${f.id}`]));
      if (params.doesPumpOwnerPayFee) row.push(point.ownerFarmerProfit || 0);
      row.push(point.pumpBusinessProfit);
      return row.join(',');
    });

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
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg print:hidden"><TrendingUp className="w-5 h-5" /></span>
            Profit Simulation Results
          </h2>
          <p className="text-sm text-slate-500">Trend of individual profits for each farmer and the pump business</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold border border-emerald-200 transition-colors">
            Excel (CSV)
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold border border-slate-300 transition-colors">
            PDF / Print
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-4 mb-6 border border-blue-100 flex flex-col md:flex-row gap-4 justify-between items-center print:break-inside-avoid shadow-sm">
        <div className="text-sm text-center md:text-left flex-1">
          <p className="text-slate-600 mb-1 font-medium">Current Farmer Discount (at {params.returnRate}%):</p>
          <p className="font-bold text-blue-700 text-2xl">{Math.round(stats.currentDiscountAmount).toLocaleString()} <span className="text-sm font-normal">Taka/{params.areaUnit}</span></p>
          <p className="text-xs text-slate-500 mt-1">New Fee: <span className="font-semibold text-slate-700">{Math.round(stats.fee - stats.currentDiscountAmount).toLocaleString()}</span> Taka</p>
        </div>
        <div className="hidden md:block w-px h-16 bg-blue-200"></div>
        <div className="text-sm text-center md:text-left flex-1">
          <p className="text-slate-600 mb-1 font-medium">Pump Business (at {params.returnRate}%):</p>
          <div className="flex flex-col gap-0.5 text-xs max-w-[200px] mx-auto md:mx-0">
            <div className="flex justify-between"><span className="text-slate-500">Revenue:</span><span className="font-semibold text-slate-700">{Math.round(stats.currentRevenue).toLocaleString()} Taka</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Expenses:</span><span className="font-semibold text-slate-700">-{Math.round(stats.currentExpenses).toLocaleString()} Taka</span></div>
            <div className="flex justify-between border-t border-blue-200 mt-1 pt-1"><span className="font-bold text-slate-700">Net Profit:</span><span className="font-bold text-indigo-700">{Math.round(currentPoint.pumpBusinessProfit).toLocaleString()} Taka</span></div>
          </div>
        </div>
        <div className="hidden md:block w-px h-16 bg-blue-200"></div>
        <div className="text-sm text-center md:text-left flex-1">
          <p className="text-slate-600 mb-1 font-medium">Max Win-Win Discount (Owner keeps baseline profit):</p>
          <p className="font-bold text-emerald-700 text-2xl">{Math.round(stats.maxDiscountAmount).toLocaleString()} <span className="text-sm font-normal">Taka/{params.areaUnit}</span></p>
          <p className="text-xs text-slate-500 mt-1">Max Return Rate: <span className="font-semibold text-slate-700">{Math.max(0, Math.floor(stats.maxReturnRate * 10) / 10)}%</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 max-h-48 overflow-y-auto pr-2 print:max-h-none print:overflow-visible">
        {params.farmers.map((farmer, idx) => {
          const color = FARMER_COLORS[idx % FARMER_COLORS.length];
          const profit = currentPoint.farmerProfits[farmer.id] || 0;
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
            <div className="text-lg font-bold text-slate-500">{Math.round(currentPoint.ownerFarmerProfit).toLocaleString()} <span className="text-xs font-normal text-slate-500">Taka</span></div>
          </div>
        )}
        <div className="bg-indigo-50 rounded-xl p-3 border-l-4 border-l-indigo-600 border-indigo-100 col-span-2 md:col-span-1 print:break-inside-avoid">
          <div className="text-xs font-medium text-indigo-800 mb-1">Pump Business</div>
          <div className="text-lg font-bold text-indigo-600">{Math.round(currentPoint.pumpBusinessProfit).toLocaleString()} <span className="text-xs font-normal">Taka</span></div>
        </div>
      </div>

      <div className="w-full print:min-h-[500px]" style={{ height: '420px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="returnRate" tickFormatter={(v) => `${v}%`} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickMargin={10} />
            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v.toLocaleString()}`} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} Taka`, '']} labelFormatter={(l) => `Return Rate: ${l}%`}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <ReferenceLine x={params.returnRate} stroke="#6366f1" strokeDasharray="4 4" label={{ position: 'top', value: 'Current Setting', fill: '#6366f1', fontSize: 12, fontWeight: 'bold' }} />
            <ReferenceLine y={stats.baselinePumpBusinessProfit} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Baseline Owner Profit', fill: '#ef4444', fontSize: 12 }} />
            {params.farmers.map((farmer, idx) => (
              <Line key={farmer.id} type="monotone" dataKey={`farmer_${farmer.id}`} name={farmer.name}
                stroke={FARMER_COLORS[idx % FARMER_COLORS.length]} strokeWidth={2} dot={false}
                activeDot={{ r: 5, fill: FARMER_COLORS[idx % FARMER_COLORS.length], stroke: '#fff', strokeWidth: 2 }} />
            ))}
            {params.doesPumpOwnerPayFee && (
              <Line type="monotone" dataKey="ownerFarmerProfit" name="Owner's Farmer Discount" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false}
                activeDot={{ r: 5, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }} />
            )}
            <Line type="monotone" dataKey="pumpBusinessProfit" name="Pump Business Profit" stroke="#6366f1" strokeWidth={3} dot={false}
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; // Closes DetailedChart

interface DetailedFormulasProps {
  params: SimulationParams;
}

const DetailedFormulas: React.FC<DetailedFormulasProps> = ({ params }) => {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-slate-200/60 shadow-sm max-w-4xl mx-auto">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Calculation Formulas</h3>
      <div className="space-y-8 text-slate-600">
        {params.doesPumpOwnerPayFee ? (
          <>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 text-lg border-b border-slate-200 pb-2">1. Base Variables (Owner Pays Fee)</h4>
              <ul className="space-y-3 ml-2">
                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3"><span className="font-medium text-slate-700 min-w-[220px]">Total Collected Fees</span><code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Sum of (Farmer's Area × Fee) + (Owner's Area × Owner's Fee)</code></li>
                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3"><span className="font-medium text-slate-700 min-w-[220px]">Total Expenses</span><code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Electricity + Labor Cost + Other Cost</code></li>
                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3"><span className="font-medium text-slate-700 min-w-[220px]">New Total Expenses</span><code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= {'{Electricity × (1 - Water Reduction Rate / 100)}'} + Labor Cost + Other Cost</code></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 text-lg border-b border-slate-200 pb-2">2. Profit Calculations</h4>
              <ul className="space-y-4 ml-2">
                <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100"><span className="block font-bold text-emerald-800 mb-2">🧑‍🌾 Farmer's Profit (Discount)</span><code className="bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-sm block overflow-x-auto">= (Fee × Individual Area) × (Return Rate / 100)</code></li>
                <li className="bg-slate-100 p-4 rounded-xl border border-slate-200"><span className="block font-bold text-slate-700 mb-2">👤 Owner's Farmer Discount</span><code className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm block overflow-x-auto">= (Owner's Fee × Owner's Area) × (Return Rate / 100)</code></li>
                <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100"><span className="block font-bold text-indigo-800 mb-2">⚙️ Pump Business Profit</span><code className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm block overflow-x-auto">= {'{ Total Collected Fees × (1 - Return Rate / 100) }'} - New Total Expenses</code></li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 text-lg border-b border-slate-200 pb-2">1. Base Variables</h4>
              <ul className="space-y-3 ml-2">
                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3"><span className="font-medium text-slate-700 min-w-[220px]">Total Area</span><code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Sum of all Farmers' areas + Pump Owner's area</code></li>
                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3"><span className="font-medium text-slate-700 min-w-[220px]">Total Fee from all Farmers</span><code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Fee × Sum of all Farmers' areas</code></li>
                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3"><span className="font-medium text-slate-700 min-w-[220px]">Total Expenses</span><code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Electricity + Labor Cost + Other Cost</code></li>
                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3"><span className="font-medium text-slate-700 min-w-[220px]">Farmers' Expenses Share</span><code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= Total Expenses × (Sum of all Farmers' areas / Total Area)</code></li>
                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3"><span className="font-medium text-slate-700 min-w-[220px]">New Total Expenses</span><code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= {'{Electricity × (1 - Water Reduction Rate / 100)}'} + Labor Cost + Other Cost</code></li>
                <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3"><span className="font-medium text-slate-700 min-w-[220px]">New Expenses (Farmers' Share)</span><code className="bg-slate-100 text-pink-600 px-2 py-0.5 rounded text-sm">= New Total Expenses × (Sum of all Farmers' areas / Total Area)</code></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 text-lg border-b border-slate-200 pb-2">2. Profit Calculations</h4>
              <ul className="space-y-4 ml-2">
                <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100"><span className="block font-bold text-emerald-800 mb-2">🧑‍🌾 Individual Farmer's Profit</span><code className="bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-sm block overflow-x-auto">= (Fee × Individual Farmer's area) × (Return Rate / 100)</code></li>
                <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100"><span className="block font-bold text-indigo-800 mb-2">⚙️ Pump Owner's Profit</span><code className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm block overflow-x-auto">= {'{ Total Fee from all Farmers × (1 - Return Rate / 100) }'} - New Expenses (Farmers' Share)</code></li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [mode, setMode] = useState<Mode>('simple');
  const [language, setLanguage] = useState<Language>('en');

  const [params, setParams] = useState<SimulationParams>({
    fee: 2000,
    pumpOwnerArea: 14,
    waterReductionRate: 15,
    doesPumpOwnerPayFee: false,
    pumpOwnerFee: 1800,
    returnRate: 2.5,
    areaUnit: 'bigha',
    electricity: 15000,
    laborCost: 5000,
    otherCost: 2000,
    farmers: [
      { id: '1', name: 'Farmer 1', area: 15 },
      { id: '2', name: 'Farmer 2', area: 16 },
    ],
  });

  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <Droplets className="w-6 h-6 text-blue-500" />
              {t.appTitle}
            </h1>
            <p className="text-sm text-slate-500">{t.appSubtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>EN</button>
              <button onClick={() => setLanguage('bn')} className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${language === 'bn' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>BN</button>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setMode('simple')} className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${mode === 'simple' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t.simpleTab}</button>
              <button onClick={() => setMode('detailed')} className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${mode === 'detailed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t.detailedTab}</button>
            </div>
          </div>
        </div>

        {/* Content */}
        {mode === 'simple' ? (
          <div className="max-w-3xl mx-auto">
            <SimpleView params={params} setParams={setParams} language={language} t={t} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <DetailedInputForm params={params} setParams={setParams} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <DetailedChart params={params} />
              <DetailedFormulas params={params} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

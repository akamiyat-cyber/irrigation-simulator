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
  electricityInputMode: 'total' | 'ratio';
  electricity: number | string;
  electricityRatio: number | string;
  waterReductionRate: number | string;
  returnRate: number;
}

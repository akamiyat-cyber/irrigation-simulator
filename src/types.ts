export interface Farmer {
  id: string;
  name: string;
  area: number | string;
}

export interface SimulationParams {
  fee: number | string;
  farmers: Farmer[];
  pumpOwnerArea: number | string;
  areaUnit: 'bigha' | 'ha';
  electricity: number | string;
  waterReductionRate: number | string;
  returnRate: number;
}

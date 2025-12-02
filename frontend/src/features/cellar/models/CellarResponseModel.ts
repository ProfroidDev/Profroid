import type { CellarType } from "./CellarType";

export interface CellarResponseModel {
  cellarId: string;
  ownerCustomerId: string;

  name: string;

  height: number;
  width: number;
  depth: number;

  bottleCapacity: number;

  hasCoolingSystem: boolean;
  hasHumidityControl: boolean;
  hasAutoRegulation: boolean;

  cellarType: CellarType;
}

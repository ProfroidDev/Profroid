export interface PartRequestModel {
  name: string;
  category: string;
  quantity: number;
  price: number;
  supplier: string;
  lowStockThreshold?: number;
  outOfStockThreshold?: number;
  highStockThreshold?: number;
  available?: boolean;
}

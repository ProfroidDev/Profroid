export interface PartResponseModel {
  partId: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  supplier: string;
  lowStockThreshold: number;
  outOfStockThreshold: number;
  highStockThreshold: number;
  status: string; // "In Stock" | "Low Stock" | "Out of Stock"
  available: boolean;
  imageFileId?: string | null;
}

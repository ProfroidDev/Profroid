export interface ReportRequestModel {
  appointmentId: string;
  hoursWorked: number;
  frais: number;
  fraisDeplacement: number;
  parts: ReportPartRequestModel[];
}

export interface ReportPartRequestModel {
  partId: string;
  quantity: number;
  price: number;
  notes?: string;
}

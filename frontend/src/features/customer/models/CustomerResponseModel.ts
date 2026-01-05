import type { CustomerPhoneNumber } from "./CustomerPhoneNumber";

export interface CustomerResponseModel {
  customerId: string;
  firstName: string;
  lastName: string;

  phoneNumbers: CustomerPhoneNumber[];

  streetAddress: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  userId: string;
  isActive?: boolean;
}

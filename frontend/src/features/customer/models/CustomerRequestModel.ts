import type { CustomerPhoneNumber } from "./CustomerPhoneNumber";

export interface CustomerRequestModel {
  firstName: string;
  lastName: string;
  email: string;
  password: string;

  phoneNumbers: CustomerPhoneNumber[];

  streetAddress: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

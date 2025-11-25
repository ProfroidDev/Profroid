export type PhoneType = "MOBILE" | "HOME" | "WORK";

export interface CustomerPhoneNumber {
  type: PhoneType;
  number: string;
}

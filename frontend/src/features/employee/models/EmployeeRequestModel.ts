import type { EmployeeAddress } from "./EmployeeAddress";
import type { EmployeePhoneNumber } from "./EmployeePhoneNumber";
import type { EmployeeRole } from "./EmployeeRole";


export interface EmployeeRequestModel {
  userId: string;
  firstName: string;
  lastName: string;

  phoneNumbers: EmployeePhoneNumber[];
  employeeAddress: EmployeeAddress;
  employeeRole: EmployeeRole;
}

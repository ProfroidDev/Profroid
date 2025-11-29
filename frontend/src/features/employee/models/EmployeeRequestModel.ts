import type { EmployeeAddress } from "./EmployeeAddress";
import type { EmployeePhoneNumber } from "./EmployeePhoneNumber";
import type { EmployeeRole } from "./EmployeeRole";


export interface EmployeeRequestModel {
  firstName: string;
  lastName: string;
  userId: string;

  phoneNumbers: EmployeePhoneNumber[];
  employeeAddress: EmployeeAddress;
  employeeRole: EmployeeRole;
}

import type { EmployeeAddress } from "./EmployeeAddress";
import type { EmployeeIdentifier } from "./EmployeeIdentifier";
import type { EmployeePhoneNumber } from "./EmployeePhoneNumber";
import type { EmployeeRole } from "./EmployeeRole";


export interface EmployeeResponseModel {
  employeeIdentifier: EmployeeIdentifier;
  firstName: string;
  lastName: string;
  userId: string;

  phoneNumbers: EmployeePhoneNumber[];
  employeeAddress: EmployeeAddress;
  employeeRole: EmployeeRole;
}

import { test, expect } from "../../fixtures/basePage";

test("User can add a new employee", async ({ employeePage }) => {
  await employeePage.goto();

  // Step 1: Open the Add Employee modal
  await employeePage.openCreateModal();
  
  await employeePage.page.getByRole('heading', { name: /Add New Employee/i }).waitFor();

  // Step 2: Fill in employee details
  const timestamp = Date.now();
  const firstName = `TestEmp${timestamp}`;
  const lastName = `Employee${timestamp}`;
  const userId = `user${timestamp}`;

  await employeePage.createEmployee({
    firstName: firstName,
    lastName: lastName,
    userId: userId,
    role: "TECHNICIAN",
    phoneType: "WORK",
    phoneNumber: "555-987-6543",
    street: "456 Employee Ave",
    city: "Toronto",
    province: "Ontario",
    postalCode: "M5V 2T3"
  });
  
  await employeePage.page.getByRole('button', { name: 'Add Employee' }).click();

  // Step 3: Verify the new employee appears in the table
  await expect(
    employeePage.page.getByText(new RegExp(`${lastName}.*${firstName}`, "i"))
  ).toBeVisible({ timeout: 10000 });
});

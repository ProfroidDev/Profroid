import { adminTest as test, expect } from "../../fixtures/authFixtures";

test.describe.serial("Employee Edit and Delete", () => {
  test("User can edit an existing employee", async ({ loggedInAdminHomePage, employeePage }) => {
    await loggedInAdminHomePage.goToEmployees();

    // Step 1: Get the first active employee from the table
    const row = await employeePage.getFirstActiveEmployeeRow();

    // Step 2: Open the Edit modal by clicking the Edit button on the row
    await row.getByRole("button", { name: /^edit$/i }).click();

    await employeePage.page.getByRole('heading', { name: /Edit Employee/i }).waitFor();

    // Step 3: Change role (only editable field)
    await employeePage.editEmployee({
      role: "ADMIN"
    });
    await employeePage.page.getByRole('button', { name: 'Update Employee' }).click();
    // Step 4: Validate update completes
    await expect(employeePage.page.getByRole('heading', { name: /Edit Employee/i })).toBeHidden({ timeout: 5000 });
  });
});

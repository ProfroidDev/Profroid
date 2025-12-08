import { test, expect } from "../../fixtures/basePage";

test.describe.serial("Employee Edit and Delete", () => {
  test("User can edit an existing employee", async ({ employeePage }) => {
    await employeePage.goto();

    // Step 1: Get the first active employee from the table
    const row = await employeePage.getFirstActiveEmployeeRow();

    // Step 2: Open the Edit modal by clicking the Edit button on the row
    await row.getByRole("button", { name: /^edit$/i }).click();

    await employeePage.page.getByRole('heading', { name: /Edit Employee/i }).waitFor();

    // Step 3: Change employee fields
    await employeePage.editEmployee({
      firstName: "UpdatedFirst",
      lastName: "UpdatedLast",
      street: "555 Updated Street",
      city: "Montreal",
      province: "Quebec",
      postalCode: "H1A 2B3"
    });
    await employeePage.page.getByRole('button', { name: 'Update Employee' }).click();
    // Step 4: Validate update in table
    await expect(
      employeePage.page.getByText("UpdatedFirst")
    ).toBeVisible();
  });

  test("User can deactivate an employee", async ({ homePage, employeePage }) => {
    await homePage.goto();
    await homePage.goToEmployees();
    await employeePage.goto();

    // Get first active employee from the table
    const row = await employeePage.getFirstActiveEmployeeRow();

    // Click deactivate button for the employee
    const deactivateBtn = row.getByRole("button", { name: /deactivate/i });
    await deactivateBtn.waitFor({ state: "visible" });
    await deactivateBtn.click();

    // Confirm deactivation
    const modal = employeePage.page.locator(".confirmation-modal-container");
    await expect(modal).toBeVisible({ timeout: 5000 });
    await modal.getByRole("button", { name: /deactivate/i }).click();

    // Verify the row is now grayed out (deactivated)
    await expect(row).toHaveClass(/row-deactivated/);
  });
});

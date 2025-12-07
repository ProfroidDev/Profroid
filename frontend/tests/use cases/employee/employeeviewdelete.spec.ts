import { test, expect } from "../../fixtures/basePage";

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

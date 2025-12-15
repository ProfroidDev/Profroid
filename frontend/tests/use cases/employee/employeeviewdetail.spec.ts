import { adminTest as test, expect } from "../../fixtures/authFixtures";

test.describe.serial("Employee Operations", () => {
  test("User can view employee details", async ({ loggedInAdminHomePage, employeePage }) => {
    // 1. Navigate to Employees page as admin
    await loggedInAdminHomePage.goToEmployees();

    // 2. Ensure table loaded
    await expect(employeePage.tableRows.first()).toBeVisible();

    // 3. Get the first active employee from the table
    const firstRow = await employeePage.getFirstActiveEmployeeRow();
    
    // Get firstName from column 1 and lastName from column 0
    const lastNameText = await firstRow.locator("td").nth(0).innerText();
    const firstNameText = await firstRow.locator("td").nth(1).innerText();

    // 4. Click "View Details" for that employee
    await employeePage.clickViewDetails(firstNameText, lastNameText);

    // 5. Assert modal is visible
    const modal = employeePage.page.locator(".modal-container-light");
    await expect(modal).toBeVisible();

    // 6. Validate modal fields (ID, Name, Address, etc)
    const modalField = (label: string) =>
      modal.locator(`.modal-section:has-text("${label}") .modal-value`);

    await expect(modalField("Employee ID")).not.toBeEmpty();
    await expect(modalField("Name")).toContainText(`${firstNameText} ${lastNameText}`);

    // 7. Close modal
    await modal.locator("button.modal-close-light").click();
    await expect(modal).toBeHidden();
  });

  test("User can deactivate and reactivate an employee", async ({ loggedInAdminHomePage, employeePage }) => {
    await loggedInAdminHomePage.goToEmployees();

    // Get first active employee from the table
    const row = await employeePage.getFirstActiveEmployeeRow();

    // Click deactivate button for the employee
    const deactivateBtn = row.getByRole("button", { name: /deactivate/i });
    await deactivateBtn.waitFor({ state: "visible" });
    await deactivateBtn.click();

    // Confirm deactivation
    let modal = employeePage.page.locator(".confirmation-modal-container");
    await expect(modal).toBeVisible({ timeout: 5000 });
    await modal.getByRole("button", { name: /deactivate/i }).click();

    // Verify the row is now grayed out (deactivated)
    await expect(row).toHaveClass(/row-deactivated/);

    // Now reactivate the employee
    const reactivateBtn = row.getByRole("button", { name: /reactivate/i });
    await reactivateBtn.waitFor({ state: "visible" });
    await reactivateBtn.click();

    // Confirm reactivation
    modal = employeePage.page.locator(".confirmation-modal-container");
    await expect(modal).toBeVisible({ timeout: 5000 });
    await modal.getByRole("button", { name: /reactivate/i }).click();

    // Verify the row no longer has deactivated class
    await expect(row).not.toHaveClass(/row-deactivated/);
  });
});

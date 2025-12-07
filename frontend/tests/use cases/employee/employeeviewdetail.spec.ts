import { test, expect } from "../../fixtures/basePage";

test.describe("Employee – View Details", () => {
  test("User can view employee details", async ({ homePage, employeePage }) => {
    
    // 1. Navigate to Home → Employees page
    await homePage.goto();
    await homePage.goToEmployees();

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
});

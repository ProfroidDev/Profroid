import { test, expect } from "../../fixtures/basePage";

test.describe("Customer – View Details", () => {
  test("User can view customer details", async ({ homePage, customerPage }) => {
    
    // 1. Navigate to Home → Customers page
    await homePage.goto();
    await homePage.goToCustomers();

    // 2. Ensure table loaded
    await expect(customerPage.tableRows.first()).toBeVisible();

    // 3. Grab the name of the first customer from the table
    const firstRow = customerPage.tableRows.first();
    const fullName = await firstRow.locator("td").nth(0).innerText();
    const [firstName, lastName] = fullName.trim().split(" ");

    // 4. Click "View Details" for that customer
    await customerPage.clickViewDetails(firstName, lastName);

    // 5. Assert modal is visible
    const modal = customerPage.page.locator(".modal-container-light");
    await expect(modal).toBeVisible();

    // 6. Validate modal fields (ID, Name, Address, User ID)
    const modalField = (label: string) =>
      modal.locator(`.modal-section:has-text("${label}") .modal-value`);

    await expect(modalField("Customer ID")).not.toBeEmpty();
    await expect(modalField("Name")).toContainText(fullName);
    await expect(modalField("Address")).not.toBeEmpty();
    await expect(modalField("User ID")).not.toBeEmpty();

    // 7. Close modal
    await modal.locator("button.modal-close-light").click();
    await expect(modal).toBeHidden();
  });
});

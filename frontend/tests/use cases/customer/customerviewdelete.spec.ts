import { test, expect } from "../../fixtures/basePage";

test("User can delete a customer", async ({ homePage, customerPage }) => {
  await homePage.goto();
  await homePage.goToCustomers();
  await customerPage.goto();

  await customerPage.clickDelete("John", "Doe");

  await customerPage.confirmDelete();

  await expect(customerPage.page.getByText("John Doe")).not.toBeVisible();
});

import { test, expect } from "../../fixtures/basePage";

test("User can edit an existing customer", async ({ customerPage }) => {
  await customerPage.goto();

  // Step 1: Open the Edit modal
  await customerPage.clickEdit("John", "Doe");

  await customerPage.page.getByRole('heading', { name: /Edit Customer/i }).waitFor();

  // Step 2: Change customer fields
  await customerPage.editCustomer({
    firstName: "Johnny",
    lastName: "Doer",
    phoneNumber: "438-123-9999",
    street: "555 Updated Street",
    city: "Montreal",
    province: "Quebec",
    country: "Canada",
    postalCode: "H1A 2B3"
  });

  // Step 3: Validate update in table
  await expect(
    customerPage.page.getByText("Johnny Doer")
  ).toBeVisible();
});

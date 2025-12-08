import { test, expect } from "../../fixtures/basePage";

test("User can add a new customer", async ({ customerPage }) => {
  await customerPage.goto();

  // Step 1: Open the Add Customer modal
  await customerPage.openCreateModal();
  
  await customerPage.page.getByRole('heading', { name: /Create Customer/i }).waitFor();

  // Step 2: Fill in customer details
  const timestamp = Date.now();
  const firstName = `Test${timestamp}`;
  const lastName = `Customer${timestamp}`;

  await customerPage.createCustomer({
    firstName: firstName,
    lastName: lastName,
    phoneType: "MOBILE",
    phoneNumber: "555-123-4567",
    street: "123 Test Street",
    city: "Toronto",
    province: "Ontario",
    postalCode: "M5V 3A8"
  });

  // Step 3: Verify the new customer appears in the table
  await expect(
    customerPage.page.getByText(`${firstName} ${lastName}`)
  ).toBeVisible({ timeout: 10000 });
});

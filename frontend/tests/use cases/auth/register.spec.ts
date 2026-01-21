import { test, expect } from '../../fixtures/basePage';
import { Page } from '@playwright/test';
import { SignupPage } from '../../support/page-objects/pages/signup.page';

test.describe('User Registration', () => {
  test('user can register and complete profile', async ({ homePage }) => {
    const page: Page = (homePage as unknown as { page: Page }).page;
    const signup = new SignupPage(page);

    const ts = Date.now();
    const email = `user${ts}@example.com`;
    const password = `Pass${ts}!a`;

    // Step 1: Create account
    await signup.signup(email, password);

    // Step 2: Complete profile
    await signup.completeProfile({
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main St',
      city: 'Toronto',
      province: 'Ontario',
      postalCode: 'M5H 2N2',
      phoneNumber: '123-456-7890',
      phoneType: 'Mobile',
    });

    // Expect navbar shows customer links once signed in
    await homePage.waitForHomeURL();
    await expect(homePage.customerAppointmentLink()).toBeVisible({ timeout: 10000 });
    await expect(homePage.serviceLink()).toBeVisible({ timeout: 10000 });
  });
});

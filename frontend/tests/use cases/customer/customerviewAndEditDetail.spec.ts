import { Page } from '@playwright/test';
import { customerTest as test, expect } from '../../fixtures/authFixtures';
import { UserProfilePage } from '../../support/page-objects/pages/userProfile.page';

test.describe('Profile - View and Edit', () => {
  test('User can view profile, edit fields, and save', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const profilePage = new UserProfilePage(page);

    await profilePage.goto();

    // View profile fields
    await expect(profilePage.firstNameDisplay()).toBeVisible();
    await expect(profilePage.addressDisplay()).toBeVisible();

    // Enter edit mode
    await profilePage.editButton().click();

    const ts = Date.now();
    const newFirst = `John${ts}`;
    const newLast = `Doe${ts}`;
    const newPhone = '555-111-2222';
    const newStreet = '789 Updated St';

    await profilePage.firstNameInput().fill(newFirst);
    await profilePage.lastNameInput().fill(newLast);
    await profilePage.phoneInput().fill(newPhone);
    await profilePage.streetInput().fill(newStreet);

    await profilePage.saveButton().click();

    // Verify saved values on display view
    await expect(profilePage.firstNameDisplay()).toContainText(newFirst);
    await expect(profilePage.phoneDisplay()).toContainText(newPhone);
    await expect(profilePage.addressDisplay()).toContainText(newStreet);
  });
});

import { Page } from '@playwright/test';
import { customerTest as test, expect } from '../../fixtures/authFixtures';
import { UserProfilePage } from '../../support/page-objects/pages/userProfile.page';

test.describe('Profile - Add Cellar Intake', () => {
  test('User can add a cellar intake', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const profilePage = new UserProfilePage(page);

    await profilePage.goto();

    await profilePage.addCellarIntakeButton().click();

    const ts = Date.now();
    await profilePage.fillCellarIntake({
      name: `Main Cellar ${ts}`,
      heightCm: '200',
      widthCm: '300',
      depthCm: '250',
      capacity: '500',
      type: 'Private',
      cooling: true,
      humidityControl: true,
      autoRegulation: false,
    });

    await profilePage.createCellarButton().click();

    await expect(profilePage.cellarCardByName(`Main Cellar ${ts}`)).toBeVisible({ timeout: 10000 });
  });
});

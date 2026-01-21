import { adminTest as test, expect } from '../../fixtures/authFixtures';

test.describe('Services Page - View Service Details', () => {
  test.beforeEach(async ({ loggedInAdminHomePage, jobPage }) => {
    await loggedInAdminHomePage.goToServices();
    await jobPage.goto();
  });

  test('User can view service details', async ({ jobPage }) => {
    // Find the first service card and get its name
    const firstServiceCard = jobPage.page.locator('.service-card-wrapper').first();
    const serviceName = await firstServiceCard.locator('.service-title').textContent();

    if (!serviceName) {
      test.skip();
      return;
    }

    // Click View Details button
    await jobPage.clickViewDetails(serviceName.trim());

    // Verify details modal is visible
    const detailsModal = jobPage.detailsModal();
    await expect(detailsModal).toBeVisible({ timeout: 5000 });

    // Verify service information is displayed
    await expect(detailsModal.getByText(/Service Details/i)).toBeVisible();
    await expect(detailsModal.getByText(/Job ID:/i)).toBeVisible();
    await expect(detailsModal.getByText(/Name:/i)).toBeVisible();
    await expect(detailsModal.getByText(/Description:/i)).toBeVisible();
    await expect(detailsModal.getByText(/Hourly Rate:/i)).toBeVisible();

    // Close the modal
    await jobPage.closeDetailsModal();
    await expect(detailsModal).toBeHidden();
  });

  test('User can close service details modal', async ({ jobPage }) => {
    const firstServiceCard = jobPage.page.locator('.service-card-wrapper').first();
    const serviceName = await firstServiceCard.locator('.service-title').textContent();

    if (!serviceName) {
      test.skip();
      return;
    }

    await jobPage.clickViewDetails(serviceName.trim());
    await expect(jobPage.detailsModal()).toBeVisible({ timeout: 5000 });

    // Close modal using X button
    await jobPage.closeDetailsModal();
    await expect(jobPage.detailsModal()).toBeHidden();
  });
});

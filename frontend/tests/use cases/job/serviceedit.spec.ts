import { adminTest as test, expect } from '../../fixtures/authFixtures';

test.describe('Services Page - Edit Service', () => {
  test.beforeEach(async ({ loggedInAdminHomePage, jobPage }) => {
    await loggedInAdminHomePage.goToServices();
    await jobPage.goto();
  });

  test('User can modify a service', async ({ jobPage }) => {
    // First, create a service to modify
    const timestamp = Date.now();
    const serviceName = `Test Service ${timestamp}`;
    const newServiceName = `Updated Service ${timestamp}`;
    const newDescription = `Updated Description ${timestamp}`;

    // Create initial service
    await jobPage.openCreateModal();
    await jobPage.createService({
      jobName: serviceName,
      jobDescription: 'Original Description',
      hourlyRate: '100',
      estimatedDurationMinutes: '60',
    });

    await jobPage.expectSuccessToast(/created successfully/i);

    // Now modify it
    await jobPage.clickModify(serviceName);

    // Verify update modal is open
    await expect(jobPage.updateModal()).toBeVisible({ timeout: 5000 });

    // Update the service
    await jobPage.updateService({
      jobName: newServiceName,
      jobDescription: newDescription,
      hourlyRate: '200',
      estimatedDurationMinutes: '90',
    });

    // Verify success message
    await jobPage.expectSuccessToast(/updated successfully/i);

    // Verify updated service appears in the list
    await jobPage.expectServiceVisible(newServiceName);
  });

  test('User can cancel modifying a service', async ({ jobPage }) => {
    const firstServiceCard = jobPage.page.locator('.service-card-wrapper').first();
    const serviceName = await firstServiceCard.locator('.service-title').textContent();

    if (!serviceName) {
      test.skip();
      return;
    }

    await jobPage.clickModify(serviceName.trim());
    await expect(jobPage.updateModal()).toBeVisible({ timeout: 5000 });

    // Make a change
    await jobPage.jobNameUpdateInput().clear();
    await jobPage.jobNameUpdateInput().fill('Some new name');

    // Cancel instead of saving
    await jobPage.cancelUpdateButton().click();

    // Modal should be hidden
    await expect(jobPage.updateModal()).toBeHidden();
  });
});

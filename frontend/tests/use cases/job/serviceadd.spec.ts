import { adminTest as test, expect } from '../../fixtures/authFixtures';

test.describe('Services Page - Add Service', () => {
  test.beforeEach(async ({ loggedInAdminHomePage, jobPage }) => {
    await loggedInAdminHomePage.goToServices();
    await jobPage.goto();
  });

  test('User can create a new service', async ({ jobPage }) => {
    const timestamp = Date.now();
    const serviceName = `Test Service ${timestamp}`;
    const description = `Test Description ${timestamp}`;
    const hourlyRate = '150.00';
    const duration = '60';

    // Open create modal
    await jobPage.openCreateModal();

    // Fill in service details
    await jobPage.createService({
      jobName: serviceName,
      jobDescription: description,
      hourlyRate: hourlyRate,
      estimatedDurationMinutes: duration,
    });

    // Verify success message
    await jobPage.expectSuccessToast(/created successfully/i);

    // Verify new service appears in the list
    await jobPage.expectServiceVisible(serviceName);
  });

  test('User cannot create service with empty job name', async ({ jobPage }) => {
    await jobPage.openCreateModal();

    // Try to submit without filling job name
    await jobPage.jobDescriptionCreateInput().fill('Test Description');
    await jobPage.hourlyRateCreateInput().fill('100');
    await jobPage.estimatedDurationCreateInput().fill('60');

    await jobPage.createButton().click();

    // Verify error message appears
    await jobPage.expectErrorMessage(/job name is required/i);

    // Modal should still be open
    await expect(jobPage.createModal()).toBeVisible();
  });

  test('User cannot create service with empty description', async ({ jobPage }) => {
    await jobPage.openCreateModal();

    const timestamp = Date.now();

    await jobPage.jobNameCreateInput().fill(`Test Service ${timestamp}`);
    await jobPage.hourlyRateCreateInput().fill('100');
    await jobPage.estimatedDurationCreateInput().fill('60');

    await jobPage.createButton().click();

    // Verify error message appears
    await jobPage.expectErrorMessage(/description is required/i);

    // Modal should still be open
    await expect(jobPage.createModal()).toBeVisible();
  });

  test('User cannot create service with invalid hourly rate', async ({ jobPage }) => {
    await jobPage.openCreateModal();

    const timestamp = Date.now();

    await jobPage.jobNameCreateInput().fill(`Test Service ${timestamp}`);
    await jobPage.jobDescriptionCreateInput().fill('Test Description');
    await jobPage.hourlyRateCreateInput().fill('0');
    await jobPage.estimatedDurationCreateInput().fill('60');

    await jobPage.createButton().click();

    // Verify error message appears
    await jobPage.expectErrorMessage(/hourly rate must be greater than 0/i);

    // Modal should still be open
    await expect(jobPage.createModal()).toBeVisible();
  });

  test('User cannot create service with invalid duration', async ({ jobPage }) => {
    await jobPage.openCreateModal();

    const timestamp = Date.now();

    await jobPage.jobNameCreateInput().fill(`Test Service ${timestamp}`);
    await jobPage.jobDescriptionCreateInput().fill('Test Description');
    await jobPage.hourlyRateCreateInput().fill('100');
    await jobPage.estimatedDurationCreateInput().fill('0');

    await jobPage.createButton().click();

    // Verify error message appears
    await jobPage.expectErrorMessage(/estimated duration must be greater than 0/i);

    // Modal should still be open
    await expect(jobPage.createModal()).toBeVisible();
  });

  test('User can cancel creating a service', async ({ jobPage }) => {
    await jobPage.openCreateModal();

    const timestamp = Date.now();
    const serviceName = `Test Service ${timestamp}`;

    // Fill in some data
    await jobPage.jobNameCreateInput().fill(serviceName);
    await jobPage.jobDescriptionCreateInput().fill('Test Description');

    // Cancel the modal
    await jobPage.cancelCreateButton().click();

    // Modal should be hidden
    await expect(jobPage.createModal()).toBeHidden();
  });
});

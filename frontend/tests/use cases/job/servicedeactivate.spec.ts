import { test, expect } from "../../fixtures/basePage";

test.describe("Services Page - Deactivate Service", () => {
  test.beforeEach(async ({ jobPage }) => {
    await jobPage.goto();
  });

  test("User can deactivate a service", async ({ jobPage }) => {
    // First, create a service to deactivate
    const timestamp = Date.now();
    const serviceName = `Test Service ${timestamp}`;

    await jobPage.openCreateModal();
    await jobPage.createService({
      jobName: serviceName,
      jobDescription: "Test Description",
      hourlyRate: "100",
      estimatedDurationMinutes: "60",
    });

    await jobPage.expectSuccessToast(/created successfully/i);

    // Deactivate the service
    await jobPage.clickDeactivate(serviceName);

    // Verify deactivation confirmation modal appears
    await expect(jobPage.deactivateConfirmationModal()).toBeVisible({
      timeout: 5000,
    });

    // Confirm deactivation
    await jobPage.confirmDeactivate();

    // Verify success message
    await jobPage.expectSuccessToast(/deactivated/i);

    // Verify service is now inactive
    await jobPage.expectServiceInactive(serviceName);
  });

  test("User can cancel deactivating a service", async ({ jobPage }) => {
    const firstServiceCard = jobPage.page
      .locator(".service-card-wrapper")
      .first();
    const serviceName = await firstServiceCard
      .locator(".service-title")
      .textContent();

    if (!serviceName) {
      test.skip();
      return;
    }

    const serviceWrapper = await jobPage.getServiceCard(serviceName.trim());
    const hasInactiveClass = await serviceWrapper.evaluate((el) =>
      el.classList.contains("service-inactive")
    );

    // Only test if service is active
    if (hasInactiveClass) {
      test.skip();
      return;
    }

    await jobPage.clickDeactivate(serviceName.trim());

    // Verify deactivation modal appears
    await expect(jobPage.deactivateConfirmationModal()).toBeVisible({
      timeout: 5000,
    });

    // Cancel the deactivation
    await jobPage.cancelDeactivate();

    // Modal should be hidden
    await expect(jobPage.deactivateConfirmationModal()).toBeHidden();

    // Service should still be visible and active
    await jobPage.expectServiceVisible(serviceName.trim());
  });

  test("Deactivated service shows reactivate button", async ({ jobPage }) => {
    // First, create and deactivate a service
    const timestamp = Date.now();
    const serviceName = `Test Service ${timestamp}`;

    await jobPage.openCreateModal();
    await jobPage.createService({
      jobName: serviceName,
      jobDescription: "Test Description",
      hourlyRate: "100",
      estimatedDurationMinutes: "60",
    });

    await jobPage.expectSuccessToast(/created successfully/i);

    // Deactivate the service
    await jobPage.clickDeactivate(serviceName);
    await jobPage.confirmDeactivate();

    await jobPage.expectSuccessToast(/deactivated/i);

    // Verify service shows reactivate button instead of deactivate
    const card = await jobPage.getServiceCard(serviceName);
    const reactivateButton = card.getByRole("button", { name: /reactivate/i });
    await expect(reactivateButton).toBeVisible();
  });

  test("User can reactivate a deactivated service", async ({ jobPage }) => {
    // First, create and deactivate a service
    const timestamp = Date.now();
    const serviceName = `Test Service ${timestamp}`;

    await jobPage.openCreateModal();
    await jobPage.createService({
      jobName: serviceName,
      jobDescription: "Test Description",
      hourlyRate: "100",
      estimatedDurationMinutes: "60",
    });

    await jobPage.expectSuccessToast(/created successfully/i);

    // Deactivate the service
    await jobPage.clickDeactivate(serviceName);
    await jobPage.confirmDeactivate();

    // Reactivate the service
    await jobPage.clickReactivate(serviceName);

    // Verify reactivation confirmation modal appears
    await expect(jobPage.reactivateConfirmationModal()).toBeVisible({
      timeout: 5000,
    });

    // Confirm reactivation
    await jobPage.confirmReactivate();

    // Verify success message
    await jobPage.expectSuccessToast(/reactivated successfully/i);

    // Verify service is now active again
    const card = await jobPage.getServiceCard(serviceName);
    const deactivateButton = card.getByRole("button", { name: /deactivate/i });
    await expect(deactivateButton).toBeVisible();
  });

  test("Inactive service buttons are disabled", async ({ jobPage }) => {
    // First, create and deactivate a service
    const timestamp = Date.now();
    const serviceName = `Test Service ${timestamp}`;

    await jobPage.openCreateModal();
    await jobPage.createService({
      jobName: serviceName,
      jobDescription: "Test Description",
      hourlyRate: "100",
      estimatedDurationMinutes: "60",
    });

    await jobPage.expectSuccessToast(/created successfully/i);

    // Deactivate the service
    await jobPage.clickDeactivate(serviceName);
    await jobPage.confirmDeactivate();

    // Verify view details and modify buttons are disabled
    const card = await jobPage.getServiceCard(serviceName);
    const viewDetailsButton = card.getByRole("button", {
      name: /view details/i,
    });
    const modifyButton = card.getByRole("button", { name: /modify/i });

    await expect(viewDetailsButton).toBeDisabled();
    await expect(modifyButton).toBeDisabled();
  });
});

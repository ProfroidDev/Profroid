import { Page, Locator, expect } from '@playwright/test';

export class JobPage {
  readonly page: Page;
  readonly addServiceButton: Locator;
  readonly serviceCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addServiceButton = page.getByRole('button', {
      name: /\+ add service/i,
    });
    this.serviceCards = page.locator('.service-card-wrapper');
  }

  async goto() {
    await this.page.goto('http://localhost:3000/services');
  }

  // ============================================
  // SERVICE CARD OPERATIONS
  // ============================================

  async getServiceCard(serviceName: string) {
    return this.page
      .locator('.service-card-wrapper', {
        hasText: new RegExp(serviceName, 'i'),
      })
      .first();
  }

  async clickViewDetails(serviceName: string) {
    const card = await this.getServiceCard(serviceName);
    await card.getByRole('button', { name: /view details/i }).click();
  }

  async clickModify(serviceName: string) {
    const card = await this.getServiceCard(serviceName);
    await card.getByRole('button', { name: /modify/i }).click();
  }

  async clickDeactivate(serviceName: string) {
    const card = await this.getServiceCard(serviceName);
    await card.getByRole('button', { name: /deactivate/i }).click();
  }

  async clickReactivate(serviceName: string) {
    const card = await this.getServiceCard(serviceName);
    await card.getByRole('button', { name: /reactivate/i }).click();
  }

  // ============================================
  // CREATE MODAL
  // ============================================

  createModal = () =>
    this.page.locator('.modal-overlay').filter({ hasText: /Create New Service/i });

  createFormInputs = () => this.createModal().locator('input, textarea, select');

  jobNameCreateInput = () => this.createModal().locator('#jobName');
  jobDescriptionCreateInput = () => this.createModal().locator('#jobDescription');
  hourlyRateCreateInput = () => this.createModal().locator('#hourlyRate');
  estimatedDurationCreateInput = () => this.createModal().locator('#estimatedDurationMinutes');

  createButton = () =>
    this.createModal()
      .getByRole('button', { name: /^Create Service$/i })
      .first();
  cancelCreateButton = () => this.createModal().getByRole('button', { name: /^cancel$/i });
  closeCreateButton = () => this.createModal().locator('.modal-close-light').first();

  async openCreateModal() {
    await this.addServiceButton.click();
    await expect(this.createModal()).toBeVisible({ timeout: 5000 });
  }

  async createService(data: {
    jobName: string;
    jobDescription: string;
    hourlyRate: string | number;
    estimatedDurationMinutes: string | number;
  }) {
    await this.jobNameCreateInput().fill(data.jobName);
    await this.jobDescriptionCreateInput().fill(data.jobDescription);
    await this.hourlyRateCreateInput().fill(String(data.hourlyRate));
    await this.estimatedDurationCreateInput().fill(String(data.estimatedDurationMinutes));

    await this.createButton().click();
    await expect(this.createModal()).toBeHidden({ timeout: 5000 });
  }

  async closeCreateModal() {
    await this.closeCreateButton().click();
  }

  // ============================================
  // UPDATE/MODIFY MODAL
  // ============================================

  updateModal = () => this.page.locator('.modal-overlay').filter({ hasText: /Modify Service/i });

  jobNameUpdateInput = () => this.updateModal().locator('#updateJobName');
  jobDescriptionUpdateInput = () => this.updateModal().locator('#updateJobDescription');
  hourlyRateUpdateInput = () => this.updateModal().locator('#updateHourlyRate');
  estimatedDurationUpdateInput = () =>
    this.updateModal().locator('#updateEstimatedDurationMinutes');

  updateButton = () =>
    this.updateModal()
      .getByRole('button', { name: /^Update Service$/i })
      .first();
  cancelUpdateButton = () => this.updateModal().getByRole('button', { name: /^cancel$/i });
  closeUpdateButton = () => this.updateModal().locator('.modal-close-light').first();

  async updateService(data: {
    jobName?: string;
    jobDescription?: string;
    hourlyRate?: string | number;
    estimatedDurationMinutes?: string | number;
  }) {
    if (data.jobName) await this.jobNameUpdateInput().fill(data.jobName);
    if (data.jobDescription) await this.jobDescriptionUpdateInput().fill(data.jobDescription);
    if (data.hourlyRate) await this.hourlyRateUpdateInput().fill(String(data.hourlyRate));
    if (data.estimatedDurationMinutes)
      await this.estimatedDurationUpdateInput().fill(String(data.estimatedDurationMinutes));

    await this.updateButton().click();
    await expect(this.updateModal()).toBeHidden({ timeout: 5000 });
  }

  async closeUpdateModal() {
    await this.closeUpdateButton().click();
  }

  // ============================================
  // DETAILS MODAL
  // ============================================

  detailsModal = () => this.page.locator('.modal-overlay').filter({ hasText: /Service Details/i });

  closeDetailsButton = () => this.detailsModal().locator('.modal-close-light').first();

  async closeDetailsModal() {
    await this.closeDetailsButton().click();
  }

  // ============================================
  // DEACTIVATION CONFIRMATION MODAL
  // ============================================

  deactivateConfirmationModal = () =>
    this.page.locator('.confirmation-modal-container').filter({ hasText: /Deactivate Service/i });

  reactivateConfirmationModal = () =>
    this.page.locator('.confirmation-modal-container').filter({ hasText: /Reactivate Service/i });

  confirmDeactivateButton = () =>
    this.deactivateConfirmationModal().getByRole('button', {
      name: /^deactivate$/i,
    });

  confirmReactivateButton = () =>
    this.reactivateConfirmationModal().getByRole('button', {
      name: /^reactivate$/i,
    });

  cancelDeactivateButton = () =>
    this.deactivateConfirmationModal().getByRole('button', {
      name: /^cancel$/i,
    });

  cancelReactivateButton = () =>
    this.reactivateConfirmationModal().getByRole('button', {
      name: /^cancel$/i,
    });

  async confirmDeactivate() {
    const modal = this.deactivateConfirmationModal();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await this.confirmDeactivateButton().click();
  }

  async confirmReactivate() {
    const modal = this.reactivateConfirmationModal();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await this.confirmReactivateButton().click();
  }

  async cancelDeactivate() {
    await this.cancelDeactivateButton().click();
  }

  // ============================================
  // ASSERTIONS
  // ============================================

  async expectServiceVisible(serviceName: string) {
    const card = await this.getServiceCard(serviceName);
    await expect(card).toBeVisible({ timeout: 5000 });
  }

  async expectServiceNotVisible(serviceName: string) {
    const card = this.page
      .locator('.service-card-wrapper', {
        hasText: new RegExp(serviceName, 'i'),
      })
      .first();
    await expect(card).not.toBeVisible();
  }

  async expectServiceInactive(serviceName: string) {
    const card = await this.getServiceCard(serviceName);
    await expect(card).toHaveClass(/service-inactive/);
  }

  async expectSuccessToast(message: string | RegExp) {
    const pattern = typeof message === 'string' ? new RegExp(message, 'i') : message;
    await expect(this.page.locator('.toast').filter({ hasText: pattern })).toBeVisible({
      timeout: 5000,
    });
  }

  async expectErrorMessage(message: string | RegExp) {
    const pattern = typeof message === 'string' ? new RegExp(message, 'i') : message;
    await expect(this.page.locator('.error-message').filter({ hasText: pattern })).toBeVisible({
      timeout: 5000,
    });
  }
}

import { Page, Locator } from '@playwright/test';

export class JobsPage {
  readonly page: Page;
  readonly jobCards: Locator;
  readonly addJobButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addJobButton = page.getByRole('button', {
      name: /add job|book appointment|add appointment/i,
    });
    this.jobCards = page.locator('[class*="appointment-card"]');
  }

  async goto() {
    await this.page.goto('http://localhost:3000/my-jobs');
  }

  async waitForJobsURL() {
    await this.page.waitForURL('http://localhost:3000/my-jobs');
  }

  async openAddJobModal() {
    await this.addJobButton.click();
  }

  // Find job card by customer name
  async getJobCardByCustomerName(firstName: string, lastName: string) {
    return this.page
      .locator('.appointment-card', { hasText: new RegExp(`${firstName}.*${lastName}`, 'i') })
      .first();
  }

  // Find job card by job name
  async getJobCardByJobName(jobName: string) {
    return this.page.locator('.appointment-card', { hasText: new RegExp(jobName, 'i') }).first();
  }

  // Edit a job
  async editJobByCustomerName(firstName: string, lastName: string) {
    const card = await this.getJobCardByCustomerName(firstName, lastName);
    const editButton = card.getByRole('button', { name: /edit/i });
    await editButton.click();
  }

  // Complete a job
  async completeJobByCustomerName(firstName: string, lastName: string) {
    const card = await this.getJobCardByCustomerName(firstName, lastName);
    const completeButton = card.getByRole('button', { name: /complete|mark complete/i });
    await completeButton.click();
  }

  // Cancel a job
  async cancelJobByCustomerName(firstName: string, lastName: string) {
    const card = await this.getJobCardByCustomerName(firstName, lastName);
    const cancelButton = card.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
  }

  // Accept a quotation
  async acceptQuotationByCustomerName(firstName: string, lastName: string) {
    const card = await this.getJobCardByCustomerName(firstName, lastName);
    const acceptButton = card.getByRole('button', { name: /accept/i });
    await acceptButton.click();
  }

  // View full details
  async viewJobDetailsByCustomerName(firstName: string, lastName: string) {
    const card = await this.getJobCardByCustomerName(firstName, lastName);
    const viewDetailsButton = card.getByRole('button', { name: /view full details|view details/i });
    await viewDetailsButton.click();
  }

  // Create or view report
  async openReportByCustomerName(firstName: string, lastName: string) {
    const card = await this.getJobCardByCustomerName(firstName, lastName);
    const reportButton = card.getByRole('button', { name: /report|add report/i });
    await reportButton.click();
  }

  // Confirm action (complete, cancel, accept)
  async confirmAction() {
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes/i }).first();
    await confirmButton.click();
  }

  // Toast notification
  toast = () => this.page.locator('[class*="toast"]');

  // Get status badge for a job
  async getJobStatusByCustomerName(firstName: string, lastName: string) {
    const card = await this.getJobCardByCustomerName(firstName, lastName);
    const statusBadge = card.locator('[class*="status-badge"]');
    return await statusBadge.textContent();
  }

  // Get job details from the detail modal
  async getDetailFromOpenModal(label: string) {
    const modalContent = this.page.locator('[class*="modal-content"]');
    const textLocator = modalContent.locator(`text="${label}"`).nth(0);
    const parent = textLocator.locator('..');
    const value = await parent.textContent();
    return value?.replace(label, '').trim() || '';
  }

  // Close detail modal
  async closeDetailModal() {
    const closeButton = this.page.locator('[class*="modal-close"]');
    await closeButton.click();
  }

  // Apply filters
  async filterByStatus(status: string) {
    const statusCheckbox = this.page.locator(`input[type="checkbox"][value="${status}"]`);
    const isChecked = await statusCheckbox.isChecked().catch(() => false);
    if (!isChecked) {
      await statusCheckbox.check();
    }
  }

  async clearFilters() {
    const clearButton = this.page.getByRole('button', { name: /clear/i });
    await clearButton.click();
  }

  // Get total number of jobs
  async getJobCount() {
    const cards = await this.jobCards.count();
    return cards;
  }
}

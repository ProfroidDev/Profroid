import { Page, Locator } from '@playwright/test';

export class AppointmentPage {
  readonly page: Page;
  readonly addAppointmentButton: Locator;
  readonly appointmentCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addAppointmentButton = page.getByRole('button', {
      name: /add appointment|book appointment/i,
    });
    this.appointmentCards = page.locator('[class*="appointment-card"]');
  }

  async goto() {
    await this.page.goto('http://localhost:3000/my-appointments');
  }

  async waitForAppointmentsURL() {
    await this.page.waitForURL('http://localhost:3000/my-appointments');
  }

  async openAddAppointmentModal() {
    await this.addAppointmentButton.click();
  }

  // Find appointment card by job name
  async getAppointmentCardByJobName(jobName: string) {
    return this.page.locator('.appointment-card', { hasText: new RegExp(jobName, 'i') }).first();
  }

  // Get first visible appointment card by job name (filters out hidden/filtered appointments)
  async getVisibleAppointmentCardByJobName(jobName: string) {
    const cards = await this.page
      .locator('.appointment-card', { hasText: new RegExp(jobName, 'i') })
      .all();
    for (const card of cards) {
      const isVisible = await card.isVisible();
      if (isVisible) {
        return card;
      }
    }
    // If no visible card found, return first one anyway
    return cards[0] || this.page.locator('.appointment-card').first();
  }

  // Get appointment by job name and extract appointment ID
  async getAppointmentIdByJobName(jobName: string) {
    const card = await this.getAppointmentCardByJobName(jobName);
    // The appointmentId is typically in a data attribute or can be extracted from the card
    const appointmentId = await card.getAttribute('data-appointment-id');
    return appointmentId;
  }

  // Edit an appointment
  async editAppointmentByJobName(jobName: string) {
    const card = await this.getAppointmentCardByJobName(jobName);
    const editButton = card.getByRole('button', { name: /edit/i });
    await editButton.click();
  }

  // Cancel an appointment
  async cancelAppointmentByJobName(jobName: string) {
    const card = await this.getAppointmentCardByJobName(jobName);
    const cancelButton = card.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
  }

  // View full details
  async viewAppointmentDetailsByJobName(jobName: string) {
    const card = await this.getAppointmentCardByJobName(jobName);
    const viewDetailsButton = card.getByRole('button', { name: /view full details|view details/i });
    await viewDetailsButton.click();
  }

  // Get confirmation modal and confirm cancellation
  async confirmCancelAppointment() {
    const confirmButton = this.page
      .getByRole('button', { name: /confirm|yes|delete/i })
      .filter({ hasText: /delete|yes|confirm/i });
    await confirmButton.first().click();
  }

  // Toast notification
  toast = () => this.page.locator('div.toast').first();

  // Get status badge for an appointment
  async getAppointmentStatusByJobName(jobName: string) {
    const card = await this.getAppointmentCardByJobName(jobName);
    const statusBadge = card.locator('[class*="status-badge"]');
    return await statusBadge.textContent();
  }

  // Get appointment details from the detail modal
  async getDetailFromOpenModal(label: string) {
    const modalContent = this.page.locator('[class*="modal-content"]');
    // Find text after the label
    const textLocator = modalContent.locator(`text="${label}"`).nth(0);
    const parent = textLocator.locator('..');
    const value = await parent.textContent();
    // Extract value after the label
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
}

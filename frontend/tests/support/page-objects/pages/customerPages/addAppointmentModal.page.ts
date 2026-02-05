import { Page, Locator } from '@playwright/test';

export class AddAppointmentModal {
  readonly page: Page;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[class*="appointment-modal"]');
  }

  // Form fields
  getServiceSelect = () => this.modal.locator('select').first();
  getDateInput = () => this.modal.locator('input[type="date"]');
  getTimeSelect = () => this.modal.locator('select').filter({ hasNot: this.modal.locator('select').first() }).first();
  getDescriptionInput = () => this.modal.locator('textarea').first();
  
  // Address fields - more flexible selectors
  getStreetAddressInput = () => this.modal.locator('input').filter({ hasText: /street|address/i }).first();
  getCityInput = () => this.modal.locator('input').filter({ hasText: /city/i }).first();
  getProvinceInput = () => this.modal.locator('input').filter({ hasText: /province|state/i }).first();
  getCountryInput = () => this.modal.locator('input').filter({ hasText: /country/i }).first();
  getPostalCodeInput = () => this.modal.locator('input').filter({ hasText: /postal|zip/i }).first();
  
  // Buttons
  getCloseButton = () => this.modal.locator('button[aria-label="Close"]');
  getSubmitButton = () => this.modal.getByRole('button', { name: /submit|save|book|create/i });
  getConfirmButton = () => this.page.getByRole('button', { name: /confirm|proceed|yes/i });
  getCancelButton = () => this.modal.getByRole('button', { name: /cancel/i });

  // Technician/Customer search
  getTechnicianSearchInput = () => this.modal.locator('input[type="text"]').filter({ hasText: /technician/i }).first();
  getCustomerSearchInput = () => this.modal.locator('input[type="text"]').filter({ hasText: /customer|email/i }).first();

  // Error messages
  getErrorMessage = () => this.modal.locator('[class*="error"]').first();
  getWarningMessage = () => this.modal.locator('[class*="warning"]').first();

  // Service selection
  async selectService(serviceName: string) {
    const select = this.getServiceSelect();
    const options = select.locator('option');
    const count = await options.count();
    
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text?.toLowerCase().includes(serviceName.toLowerCase())) {
        await select.selectOption({ index: i });
        break;
      }
    }
  }

  // Date selection
  async selectDate(date: string) {
    const input = this.getDateInput();
    await input.clear();
    await input.fill(date);
    await input.blur();
  }

  // Time selection
  async selectTime(time: string) {
    const select = this.getTimeSelect();
    const options = select.locator('option');
    const count = await options.count();
    
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text?.includes(time)) {
        await select.selectOption({ index: i });
        break;
      }
    }
  }

  // Description
  async enterDescription(description: string) {
    const input = this.getDescriptionInput();
    await input.fill(description);
  }

  // Address fields
  async enterAddress(address: {
    street?: string;
    city?: string;
    province?: string;
    country?: string;
    postalCode?: string;
  }) {
    if (address.street) {
      await this.getStreetAddressInput().clear();
      await this.getStreetAddressInput().fill(address.street);
    }
    if (address.city) {
      await this.getCityInput().clear();
      await this.getCityInput().fill(address.city);
    }
    if (address.province) {
      await this.getProvinceInput().clear();
      await this.getProvinceInput().fill(address.province);
    }
    if (address.country) {
      await this.getCountryInput().clear();
      await this.getCountryInput().fill(address.country);
    }
    if (address.postalCode) {
      await this.getPostalCodeInput().clear();
      await this.getPostalCodeInput().fill(address.postalCode);
    }
  }

  // Select a technician (for customer bookings)
  async selectTechnician(firstName: string, lastName: string) {
    const buttons = this.modal.locator('[class*="pill"]');
    const btn = buttons.filter({ hasText: new RegExp(`${firstName}.*${lastName}`, 'i') }).first();
    await btn.click();
  }

  // Select a customer (for technician bookings)
  async selectCustomer(firstName: string, lastName: string) {
    const buttons = this.modal.locator('[class*="pill"]');
    const btn = buttons.filter({ hasText: new RegExp(`${firstName}.*${lastName}`, 'i') }).first();
    await btn.click();
  }

  // Search customer by email (for technician mode)
  async searchCustomer(email: string) {
    const input = this.getCustomerSearchInput();
    await input.clear();
    await input.fill(email);
    await this.page.waitForTimeout(400); // Wait for search results
  }

  // Submit form
  async submit() {
    const button = this.getSubmitButton();
    // Wait for button to be enabled before clicking
    if (await button.isEnabled().catch(() => true)) {
      await button.click();
    }
  }

  // Confirm any warning dialogs (like buffer warning)
  async confirmWarning() {
    const confirmBtn = this.getConfirmButton();
    await confirmBtn.click();
  }

  // Close modal
  async close() {
    const closeBtn = this.getCloseButton();
    await closeBtn.click();
  }

  // Check if modal is visible
  async isVisible() {
    return this.modal.isVisible();
  }

  // Get error message
  async getError() {
    try {
      const error = this.getErrorMessage();
      if (await error.isVisible().catch(() => false)) {
        return await error.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  // Wait for modal to appear
  async waitForModal() {
    await this.modal.waitFor({ state: 'visible' });
  }

  // Wait for modal to disappear
  async waitForModalToClose() {
    await this.modal.waitFor({ state: 'hidden' });
  }
}

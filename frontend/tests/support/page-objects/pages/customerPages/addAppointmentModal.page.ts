import { Page, Locator } from '@playwright/test';

export class AddAppointmentModal {
  readonly page: Page;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('div.appointment-modal');
  }

  // Form fields
  getServiceSelect = () => this.modal.getByLabel(/service/i);
  getDateInput = () => this.modal.locator('input[type="date"]').first();
  getTimeSelect = () => this.modal.getByLabel(/time\s*slot/i);
  getCellarSelect = () => this.modal.getByRole('combobox', { name: /cellar/i });
  getDescriptionInput = () => this.modal.getByLabel(/description/i);

  // Address fields
  getStreetAddressInput = () => this.modal.getByLabel(/street\s*address/i);
  getCityInput = () => this.modal.getByLabel(/city/i);
  getProvinceSelect = () => this.modal.getByLabel(/province/i);
  getCountryInput = () => this.modal.getByLabel(/country/i);
  getPostalCodeInput = () => this.modal.getByLabel(/postal\s*code/i);

  // Buttons
  getCloseButton = () => this.modal.locator('button[aria-label="Close"]');
  getSubmitButton = () => this.modal.getByRole('button', { name: /submit|save|book|create/i });
  getConfirmButton = () => this.page.getByRole('button', { name: /confirm|proceed|yes/i });
  getCancelButton = () => this.modal.getByRole('button', { name: /cancel/i });

  // Technician/Customer search
  getTechnicianSearchInput = () => this.modal.getByLabel(/available\s*technicians/i);
  getCustomerSearchInput = () => this.modal.getByLabel(/customer/i);

  // Error messages
  getErrorMessage = () => this.modal.locator('[class*="error"]').first();
  getWarningMessage = () => this.modal.locator('[class*="warning"]').first();

  // Service selection
  async selectService(serviceName: string) {
    const select = this.getServiceSelect();
    const options = select.locator('option');
    const count = await options.count();
    const target = serviceName.toLowerCase();

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text?.toLowerCase().includes(target)) {
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
    await select.waitFor({ state: 'visible' });
    const handle = await select.elementHandle();
    if (handle) {
      await this.page.waitForFunction((el) => !(el as HTMLSelectElement).disabled, handle);
      await this.page.waitForFunction((el) => (el as HTMLSelectElement).options.length > 0, handle);
    }
    const normalized = time.replace(/^0/, '');
    if (handle) {
      await select.evaluate(
        (el, args: { desired: string; normalizedLabel: string }) => {
          const selectEl = el as HTMLSelectElement;
          const options = Array.from(selectEl.options).filter((opt) => !opt.disabled);
          if (options.length === 0) {
            return;
          }
          const target = options.find(
            (opt) => opt.text.includes(args.desired) || opt.text.includes(args.normalizedLabel)
          );
          const chosen = target || options[0];
          selectEl.value = chosen.value;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        },
        { desired: time, normalizedLabel: normalized }
      );
      return;
    }
  }

  async selectFirstCellar() {
    const select = this.getCellarSelect();
    const current = await select.inputValue().catch(() => '');
    if (current) {
      return;
    }

    const options = select.locator('option');
    const count = await options.count();

    for (let i = 0; i < count; i++) {
      const value = await options.nth(i).getAttribute('value');
      if (value) {
        await select.selectOption({ value });
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
      await this.getProvinceSelect().selectOption({ value: address.province });
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
      await button.scrollIntoViewIfNeeded();
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

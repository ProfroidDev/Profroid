import { Page, Locator, expect } from '@playwright/test';

export class CustomerPage {
  readonly page: Page;
  readonly addCustomerButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addCustomerButton = page.getByRole('button', { name: /add customer/i });
    this.tableRows = page.locator('.customers-table-light tbody tr');
  }

  async goto() {
    await this.page.goto('http://localhost:3000/customers');
  }

  async openCreateModal() {
    await this.addCustomerButton.click();
  }

  // Works even when DOM splits text
  async rowByName(first: string, last: string) {
    return this.page.locator('tr', { hasText: new RegExp(`${first}.*${last}`, 'i') }).first();
  }

  async clickViewDetails(first: string, last: string) {
    const row = await this.rowByName(first, last);
    await row.getByRole('button', { name: /view details/i }).click();
  }

  async clickEdit(first: string, last: string) {
    const row = await this.rowByName(first, last);
    await row.getByRole('button', { name: /^edit$/i }).click();
  }

  async clickDelete(first: string, last: string) {
    const row = await this.rowByName(first, last);
    await row.getByRole('button', { name: /^delete$/i }).click();
  }

  // ============================================
  // DELETE CONFIRMATION MODAL
  // ============================================

  deleteModal = () =>
    this.page.locator('.confirmation-modal-container').filter({ hasText: 'Delete Customer' });

  confirmDeleteButton = () => this.deleteModal().getByRole('button', { name: /^delete$/i });

  cancelDeleteButton = () => this.deleteModal().getByRole('button', { name: /^cancel$/i });

  async confirmDelete() {
    // Wait for modal to actually open
    const modal = this.deleteModal();

    await expect(modal).toBeVisible({ timeout: 5000 });

    // Wait for the confirm button inside the modal
    await expect(this.confirmDeleteButton()).toBeVisible();

    await this.confirmDeleteButton().click();
  }

  // ============================================
  // EDIT MODAL FIELDS
  // ============================================
  firstNameInput = () => this.page.locator('input').nth(0);
  lastNameInput = () => this.page.locator('input').nth(1);
  phoneNumberInput = () => this.page.locator('input').nth(2);
  streetInput = () => this.page.locator('input').nth(3);
  cityInput = () => this.page.locator('input').nth(4);
  provinceInput = () => this.page.locator('input').nth(5);
  countryInput = () => this.page.locator('input').nth(6);
  postalCodeInput = () => this.page.locator('input').nth(7);
  userIdInput = () => this.page.locator('input').nth(8);

  phoneTypeSelect = () => this.page.locator('select').nth(0);

  saveButton = () => this.page.getByRole('button', { name: /save changes/i });

  createButton = () => this.page.getByRole('button', { name: /Create Customer/i });

  // ============================================
  // EDIT ACTION
  // ============================================
  async editCustomer(data: {
    firstName?: string;
    lastName?: string;
    phoneType?: string;
    phoneNumber?: string;
    street?: string;
    city?: string;
    province?: string;
    country?: string;
    postalCode?: string;
    userId?: string;
  }) {
    if (data.firstName) await this.firstNameInput().fill(data.firstName);
    if (data.lastName) await this.lastNameInput().fill(data.lastName);
    if (data.phoneType) await this.phoneTypeSelect().selectOption(data.phoneType);
    if (data.phoneNumber) await this.phoneNumberInput().fill(data.phoneNumber);
    if (data.street) await this.streetInput().fill(data.street);
    if (data.city) await this.cityInput().fill(data.city);
    if (data.province) await this.provinceInput().fill(data.province);
    if (data.country) await this.countryInput().fill(data.country);
    if (data.postalCode) await this.postalCodeInput().fill(data.postalCode);
    if (data.userId) await this.userIdInput().fill(data.userId);

    await this.saveButton().click();
  }

  // ============================================
  // CREATE ACTION
  // ============================================
  async createCustomer(data: {
    firstName?: string;
    lastName?: string;
    phoneType?: string;
    phoneNumber?: string;
    street?: string;
    city?: string;
    province?: string;
    country?: string;
    postalCode?: string;
    userId?: string;
  }) {
    if (data.firstName) await this.firstNameInput().fill(data.firstName);
    if (data.lastName) await this.lastNameInput().fill(data.lastName);
    if (data.phoneType) await this.phoneTypeSelect().selectOption(data.phoneType);
    if (data.phoneNumber) await this.phoneNumberInput().fill(data.phoneNumber);
    if (data.street) await this.streetInput().fill(data.street);
    if (data.city) await this.cityInput().fill(data.city);
    if (data.province) await this.provinceInput().fill(data.province);
    if (data.country) await this.countryInput().fill(data.country);
    if (data.postalCode) await this.postalCodeInput().fill(data.postalCode);
    if (data.userId) await this.userIdInput().fill(data.userId);

    await this.createButton().click();
  }
}

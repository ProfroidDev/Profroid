import { Page, expect } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // -------------------------
  // Navigation
  // -------------------------

  async goto() {
    await this.page.goto('http://localhost:3000/inventory');
  }

  async waitForInventoryURL() {
    await this.page.waitForURL('http://localhost:3000/inventory');
  }

  // -------------------------
  // Locators
  // -------------------------

  addButton = () => this.page.getByRole('button', { name: /^Add$/i });
  exportDropdownButton = () => this.page.getByRole('button', { name: /^Export$/i });
  exportAllButton = () => this.page.getByRole('button', { name: /Export All/i });
  searchInput = () => this.page.locator('input[placeholder*="Search"]');

  addModal = () => this.page.locator('.modal-overlay').filter({ hasText: /Add New Part/i });
  editModal = () => this.page.locator('.modal-overlay').filter({ hasText: /Edit Part/i });

  toast = () => this.page.locator('.toast');

  partRowByName = (name: string) =>
    this.page.locator('table.parts-table tbody tr', { hasText: name }).first();

  editButtonInRow = (name: string) => this.partRowByName(name).locator('button.icon-btn');

  // -------------------------
  // Add Part
  // -------------------------

  async openAddModal() {
    await this.addButton().click();
    await expect(this.addModal()).toBeVisible({ timeout: 5000 });
  }

  async addPart(data: {
    name: string;
    category?: string;
    quantity: number;
    price: number;
    supplier: string;
    lowStockThreshold?: number;
    outOfStockThreshold?: number;
    highStockThreshold?: number;
  }) {
    await this.openAddModal();

    await this.page.locator('#add-name').fill(data.name);
    if (data.category) await this.page.locator('#add-category').selectOption(data.category);
    await this.page.locator('#add-quantity').fill(String(data.quantity));
    await this.page.locator('#add-price').fill(String(data.price));
    await this.page.locator('#add-supplier').fill(data.supplier);

    if (data.lowStockThreshold !== undefined) {
      await this.page.locator('#add-low-threshold').fill(String(data.lowStockThreshold));
    }
    if (data.outOfStockThreshold !== undefined) {
      await this.page.locator('#add-out-threshold').fill(String(data.outOfStockThreshold));
    }
    if (data.highStockThreshold !== undefined) {
      await this.page.locator('#add-high-threshold').fill(String(data.highStockThreshold));
    }

    await this.page.getByRole('button', { name: /Add Part/i }).click();
    await expect(this.addModal()).toBeHidden({ timeout: 5000 });
  }

  // -------------------------
  // Search
  // -------------------------

  async searchForPart(partName: string) {
    await this.searchInput().fill(partName);
    await this.page.waitForTimeout(500); // Allow search to filter
  }

  // -------------------------
  // Edit Part
  // -------------------------

  async waitForPartVisible(name: string) {
    await expect(this.partRowByName(name)).toBeVisible({ timeout: 10000 });
  }

  async openEditModal(name: string) {
    await this.searchForPart(name);
    await this.waitForPartVisible(name);
    await this.editButtonInRow(name).click({ timeout: 5000 });
    await expect(this.editModal()).toBeVisible({ timeout: 5000 });
  }

  async updateThresholds(data: {
    lowStockThreshold?: number;
    outOfStockThreshold?: number;
    highStockThreshold?: number;
  }) {
    if (data.lowStockThreshold !== undefined) {
      await this.page.locator('#edit-low-threshold').fill(String(data.lowStockThreshold));
    }
    if (data.outOfStockThreshold !== undefined) {
      await this.page.locator('#edit-out-threshold').fill(String(data.outOfStockThreshold));
    }
    if (data.highStockThreshold !== undefined) {
      await this.page.locator('#edit-high-threshold').fill(String(data.highStockThreshold));
    }

    await this.page.getByRole('button', { name: /Update Part/i }).click();
    await expect(this.editModal()).toBeHidden({ timeout: 5000 });
  }

  // -------------------------
  // Export CSV
  // -------------------------

  async exportAllToCsv() {
    await this.exportDropdownButton().click();
    await this.exportAllButton().click();
  }
}

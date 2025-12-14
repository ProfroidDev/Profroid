import { Page, Locator, expect } from "@playwright/test";

export class EmployeePage {
  readonly page: Page;
  readonly addEmployeeButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addEmployeeButton = page.getByRole("button", { name: /add new employee/i });
    this.tableRows = page.locator(".employees-table-light tbody tr");
  }

  async goto() {
    await this.page.goto("http://localhost:5173/employees");
  }

  async openCreateModal() {
    await this.addEmployeeButton.click();
  }

  // =====================================================
  // ROW FINDER (Match LastName first, then FirstName - opposite of customers)
  // =====================================================
  async rowByName(first: string, last: string) {
    return this.page
      .locator("tr", { hasText: new RegExp(`${last}.*${first}`, "i") })
      .first();
  }

  // Find first active employee (not row-deactivated class)
  async getFirstActiveEmployeeRow() {
    const rows = this.tableRows;
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const hasDeactivatedClass = await row
        .evaluate((el) => el.classList.contains("row-deactivated"))
        .catch(() => false);
      if (!hasDeactivatedClass) {
        return row;
      }
    }
    // If no active rows found, return first row anyway
    return rows.first();
  }

  // =====================================================
  // TABLE ACTION BUTTONS
  // =====================================================
  async clickViewDetails(first: string, last: string) {
    const row = await this.rowByName(first, last);
    await row.getByRole("button", { name: /view details/i }).click();
  }

  async clickEdit(first: string, last: string) {
    const row = await this.rowByName(first, last);
    await row.getByRole("button", { name: /^edit$/i }).click();
  }

  async clickDelete(first: string, last: string) {
    const row = await this.rowByName(first, last);
    await row.getByRole("button", { name: /^deactivate$/i }).click();
  }

  // =====================================================
  // DELETE CONFIRMATION MODAL (same structure)
  // =====================================================
  deleteModal = () =>
    this.page
      .locator(".confirmation-modal-container")
      .filter({ hasText: "Delete Employee" });

  confirmDeleteButton = () =>
    this.deleteModal().getByRole("button", { name: /^deactivate$/i });

  cancelDeleteButton = () =>
    this.deleteModal().getByRole("button", { name: /^cancel$/i });

  async confirmDelete() {
    const modal = this.deleteModal();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(this.confirmDeleteButton()).toBeVisible();
    await this.confirmDeleteButton().click();
  }

  // =====================================================
  // EDIT MODAL FIELD LOCATORS (use ID-based selectors for reliability)
  // =====================================================
  firstNameInput = () => this.page.locator("#firstName");
  lastNameInput = () => this.page.locator("#lastName");
  userIdInput = () => this.page.locator("#userId");
  roleSelect = () => this.page.locator("#role");
  phoneNumberInput = () => this.page.locator("[id^='phoneNumber-']").first();
  streetInput = () => this.page.locator("#streetAddress");
  cityInput = () => this.page.locator("#city");
  provinceInput = () => this.page.locator("#province");
  countryInput = () => this.page.locator("#country");
  postalCodeInput = () => this.page.locator("#postalCode");

  phoneTypeSelect = () => this.page.locator("[id^='phoneType-']").first();

  saveButton = () =>
    this.page.getByRole("button", { name: /save changes/i });

  addButton = () =>
    this.page.getByRole("button", { name: /Add Employee/i });

  // =====================================================
  // EDIT ACTION
  // =====================================================
  async editEmployee(data: {
    firstName?: string;
    lastName?: string;
    phoneType?: string;
    phoneNumber?: string;
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    role?: string;
  }) {
    if (data.role) await this.roleSelect().selectOption(data.role);
    if (data.firstName) await this.firstNameInput().fill(data.firstName);
    if (data.lastName) await this.lastNameInput().fill(data.lastName);
    if (data.phoneType) await this.phoneTypeSelect().selectOption(data.phoneType);
    if (data.phoneNumber) await this.phoneNumberInput().fill(data.phoneNumber);
    if (data.street) await this.streetInput().fill(data.street);
    if (data.city) await this.cityInput().fill(data.city);
    if (data.province) await this.provinceInput().selectOption(data.province);
    if (data.postalCode) await this.postalCodeInput().fill(data.postalCode);
    // Note: country is disabled and cannot be filled
  }

  // =====================================================
  // CREATE ACTION
  // =====================================================
  async createEmployee(data: {
    firstName?: string;
    lastName?: string;
    userId?: string;
    role?: string;
    phoneType?: string;
    phoneNumber?: string;
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  }) {
    if (data.firstName) {
      await this.firstNameInput().waitFor({ state: "visible" });
      await this.firstNameInput().fill(data.firstName);
    }
    if (data.lastName) {
      await this.lastNameInput().waitFor({ state: "visible" });
      await this.lastNameInput().fill(data.lastName);
    }
    if (data.userId) {
      await this.userIdInput().waitFor({ state: "visible" });
      await this.userIdInput().fill(data.userId);
    }
    if (data.role) {
      await this.roleSelect().waitFor({ state: "visible" });
      await this.roleSelect().selectOption(data.role);
    }
    if (data.street) {
      await this.streetInput().waitFor({ state: "visible" });
      await this.streetInput().fill(data.street);
    }
    if (data.province) {
      await this.provinceInput().waitFor({ state: "visible" });
      await this.provinceInput().selectOption(data.province);
    }
    if (data.city) {
      await this.cityInput().waitFor({ state: "visible" });
      await this.cityInput().fill(data.city);
    }
    if (data.postalCode) {
      await this.postalCodeInput().waitFor({ state: "visible" });
      await this.postalCodeInput().fill(data.postalCode);
    }
    if (data.phoneNumber) {
      await this.phoneNumberInput().waitFor({ state: "visible" });
      await this.phoneNumberInput().fill(data.phoneNumber);
    }
    if (data.phoneType) {
      await this.phoneTypeSelect().waitFor({ state: "visible" });
      await this.phoneTypeSelect().selectOption(data.phoneType);
    }
  }
}

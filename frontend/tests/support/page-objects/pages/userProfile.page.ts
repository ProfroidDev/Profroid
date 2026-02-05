import { Page } from '@playwright/test';

export class UserProfilePage {
  constructor(public page: Page) {}

  public async goto() {
    const profileNavLink = this.page
      .locator('nav')
      .getByRole('link', { name: /profile|account|my profile/i });
    if (await profileNavLink.isVisible().catch(() => false)) {
      await profileNavLink.click();
    } else {
      await this.page.goto('http://localhost:3000/profile');
    }
  }

  // Inputs (edit mode)
  firstNameInput = () => this.page.getByLabel(/first name/i);
  lastNameInput = () => this.page.getByLabel(/last name/i);
  phoneInput = () => this.page.getByLabel(/phone/i);
  streetInput = () => this.page.getByLabel(/address/i);
  cityInput = () => this.page.getByLabel(/city/i);
  provinceInput = () => this.page.getByLabel(/province/i);
  postalCodeInput = () => this.page.getByLabel(/postal code/i);

  // Displays (read-only view)
  firstNameDisplay = () =>
    this.page
      .getByText(/first name/i)
      .locator('..')
      .locator('span, div, p')
      .last();
  addressDisplay = () =>
    this.page
      .getByText(/address/i)
      .locator('..')
      .locator('span, div, p')
      .last();
  phoneDisplay = () => this.page.getByText(/phone/i).locator('..').locator('span, div, p').last();

  // Buttons
  editButton = () => this.page.getByRole('button', { name: /edit/i });
  saveButton = () => this.page.getByRole('button', { name: /save|update profile/i });
  addCellarIntakeButton = () => this.page.getByRole('button', { name: /add cellar intake/i });

  // Cellar modal
  private addCellarModal = () =>
    this.page
      .locator('.modal')
      .filter({ hasText: /add cellar intake/i })
      .first();
  cellarNameInput = () => this.addCellarModal().getByLabel(/cellar name/i);
  cellarHeightInput = () => this.addCellarModal().getByLabel(/height \(cm\)/i);
  cellarWidthInput = () => this.addCellarModal().getByLabel(/width \(cm\)/i);
  cellarDepthInput = () => this.addCellarModal().getByLabel(/depth \(cm\)/i);
  cellarCapacityInput = () => this.addCellarModal().getByLabel(/bottle capacity/i);
  cellarTypeSelect = () => this.addCellarModal().getByLabel(/cellar type/i);
  cellarCoolingCheckbox = () => this.addCellarModal().getByLabel(/has cooling system/i);
  cellarHumidityCheckbox = () => this.addCellarModal().getByLabel(/has humidity control/i);
  cellarAutoRegCheckbox = () => this.addCellarModal().getByLabel(/has auto regulation/i);
  createCellarButton = () => this.addCellarModal().getByRole('button', { name: /create cellar/i });
  cellarCardByName = (name: string) => this.page.getByText(name, { exact: false }).first();

  successToast = () => this.page.getByText(/updated successfully|profile updated/i);

  public async updateProfile(fields: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  }) {
    await this.goto();
    if (fields.firstName) await this.firstNameInput().fill(fields.firstName);
    if (fields.lastName) await this.lastNameInput().fill(fields.lastName);
    if (fields.phone) await this.phoneInput().fill(fields.phone);
    if (fields.street) await this.streetInput().fill(fields.street);
    if (fields.city) await this.cityInput().fill(fields.city);
    if (fields.province) await this.provinceInput().fill(fields.province);
    if (fields.postalCode) await this.postalCodeInput().fill(fields.postalCode);
    await this.saveButton().click();
  }

  public async fillCellarIntake(opts: {
    name: string;
    heightCm: string;
    widthCm: string;
    depthCm: string;
    capacity: string;
    type: string;
    cooling?: boolean;
    humidityControl?: boolean;
    autoRegulation?: boolean;
  }) {
    await this.cellarNameInput().fill(opts.name);
    await this.cellarHeightInput().fill(opts.heightCm);
    await this.cellarWidthInput().fill(opts.widthCm);
    await this.cellarDepthInput().fill(opts.depthCm);
    await this.cellarCapacityInput().fill(opts.capacity);
    await this.cellarTypeSelect().selectOption({ label: opts.type });
    if (opts.cooling) await this.cellarCoolingCheckbox().check({ force: true });
    if (opts.humidityControl) await this.cellarHumidityCheckbox().check({ force: true });
    if (opts.autoRegulation) await this.cellarAutoRegCheckbox().check({ force: true });
  }
}

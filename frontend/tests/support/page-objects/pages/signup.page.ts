import { Page } from '@playwright/test';

export class SignupPage {
  constructor(private page: Page) {}

  public async goto() {
    await this.page.goto('http://localhost:5173/register');
  }

  emailInput = () => this.page.getByLabel('Email', { exact: true });
  passwordInput = () => this.page.getByLabel('Password', { exact: true });
  confirmPasswordInput = () => this.page.getByLabel('Confirm Password', { exact: true });
  continueButton = () => this.page.locator('form').getByRole('button', { name: /continue/i });
  successToast = () => this.page.getByText(/registration complete|account created/i);

  // Step 2 fields (Complete Your Profile)
  firstNameInput = () => this.page.getByLabel(/first name/i);
  lastNameInput = () => this.page.getByLabel(/last name/i);
  streetInput = () => this.page.getByLabel(/street address/i);
  cityInput = () => this.page.getByLabel(/city/i);
  provinceSelect = () => this.page.getByLabel(/province/i);
  postalCodeInput = () => this.page.getByLabel(/postal code/i);
  phoneNumberInput = () => this.page.getByPlaceholder('123-456-7890');
  phoneTypeSelect = () => this.page.getByRole('combobox').nth(1);
  completeRegistrationButton = () => this.page.getByRole('button', { name: /complete registration/i });

  public async signup(email: string, password: string) {
    await this.goto();
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    // Fill confirm if present
    if (await this.confirmPasswordInput().isVisible().catch(() => false)) {
      await this.confirmPasswordInput().fill(password);
    }
    await this.continueButton().click();
  }

  public async completeProfile(details: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    phoneNumber?: string;
    phoneType?: string; // Mobile/Work/Home
  }) {
    await this.firstNameInput().fill(details.firstName);
    await this.lastNameInput().fill(details.lastName);
    await this.streetInput().fill(details.street);
    await this.cityInput().fill(details.city);
    await this.provinceSelect().selectOption({ label: details.province });
    await this.postalCodeInput().fill(details.postalCode);
    if (details.phoneNumber) await this.phoneNumberInput().fill(details.phoneNumber);
    if (details.phoneType) await this.phoneTypeSelect().selectOption({ label: details.phoneType });
    await this.completeRegistrationButton().click();
  }
}

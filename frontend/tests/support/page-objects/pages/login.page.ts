import { Page } from '@playwright/test';

export class LoginPage {
    constructor(private page: Page) {}

    // -------------------------
    // Navigation
    // -------------------------

    public async goto() {
        await this.page.goto('http://localhost:5173/login');
    }

    public async waitForAuthURL() {
        await this.page.waitForURL('http://localhost:5173/login');
    }

    // -------------------------
    // Locators
    // -------------------------

    emailInput = () => this.page.getByLabel(/email/i);
    passwordInput = () => this.page.getByLabel(/password/i);
    loginButton = () => this.page.locator('form').getByRole('button', { name: /sign in/i });
    errorMessage = () => this.page.locator('[role="alert"]');

    // -------------------------
    // Actions
    // -------------------------

    public async loginAs(email: string, password: string) {
        await this.goto();
        await this.emailInput().fill(email);
        await this.passwordInput().fill(password);
        await this.loginButton().click();
    }

    public async isLoggedOut() {
        await this.waitForAuthURL();
    }

    public async hasErrorMessage() {
        return await this.errorMessage().isVisible();
    }

    public async getErrorMessage() {
        return await this.errorMessage().textContent();
    }
}

import { Page } from '@playwright/test';

export class HomePage {

    constructor(private page: Page) {}

    // -------------------------
    // Navigation
    // -------------------------

    public async goto() {
        await this.page.goto('http://localhost:5173');
    }

    public async waitForHomeURL() {
        await this.page.waitForURL('http://localhost:5173');
    }

    // -------------------------
    // Locators
    // -------------------------

    partLink = () => this.page.getByRole('link', { name: 'Parts' });
    serviceLink = () => this.page.getByRole('link', { name: 'Services' });
    customerLink = () =>
  this.page.locator('nav').getByRole('link', { name: 'Customers' });
    employeeLink = () => this.page.getByRole('link', { name: 'Employees' });
    customerAppointmentLink = () => this.page.getByRole('link', { name: 'My Appointments' });
    technicianAppointmentLink = () => this.page.getByRole('link', { name: 'My Jobs' });
    hamburgerMenuButton = () => this.page.getByRole('button', { name: 'Toggle navigation' });

    // -------------------------
    // Actions - (clean helpers)
    // -------------------------

    public async goToCustomers() {
        await this.customerLink().click();
    }

    public async goToParts() {
        await this.partLink().click();
    }

    public async goToEmployees() {
        await this.employeeLink().click();
    }

    public async goToServices() {
        await this.serviceLink().click();
    }

}

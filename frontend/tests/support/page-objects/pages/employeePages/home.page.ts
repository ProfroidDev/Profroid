import { Page } from '@playwright/test';

export class EmployeeHomePage {
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

  partLink = () => this.page.locator('nav').getByRole('link', { name: 'Parts' });
  serviceLink = () => this.page.locator('nav').getByRole('link', { name: 'Services' });
  jobsLink = () => this.page.getByRole('link', { name: 'My Jobs' });
  employeeLink = () => this.page.locator('nav').getByRole('link', { name: 'Employees' });
  hamburgerMenuButton = () => this.page.getByRole('button', { name: 'Toggle navigation' });

  // -------------------------
  // Actions
  // -------------------------

  public async goToParts() {
    await this.partLink().click();
  }

  public async goToJobs() {
    await this.jobsLink().click();
  }

  public async goToServices() {
    await this.serviceLink().click();
  }

  public async goToEmployees() {
    await this.employeeLink().click();
  }

  public async openHamburgerMenu() {
    await this.hamburgerMenuButton().click();
  }
}

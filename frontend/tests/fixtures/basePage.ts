/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from '@playwright/test';
import { LoginPage } from '../support/page-objects/pages/login.page';
import { CustomerPage } from '../support/page-objects/pages/customerPages/customer.page';
import { HomePage } from '../support/page-objects/pages/customerPages/home.page';
import { EmployeePage } from '../support/page-objects/pages/employeePages/employee.page';
import { EmployeeHomePage } from '../support/page-objects/pages/employeePages/home.page';
import { JobPage } from '../support/page-objects/pages/jobPages/job.page';

export const test = base.extend<{
  loginPage: LoginPage;
  homePage: HomePage;
  employeeHomePage: EmployeeHomePage;
  customerPage: CustomerPage;
  employeePage: EmployeePage;
  jobPage: JobPage;
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  employeeHomePage: async ({ page }, use) => {
    await use(new EmployeeHomePage(page));
  },

  customerPage: async ({ page }, use) => {
    await use(new CustomerPage(page));
  },

  employeePage: async ({ page }, use) => {
    await use(new EmployeePage(page));
  },

  jobPage: async ({ page }, use) => {
    await use(new JobPage(page));
  },
});

export const expect = test.expect;

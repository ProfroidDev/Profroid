/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import { CustomerPage } from "../support/page-objects/pages/customerPages/customer.page";
import { HomePage } from "../support/page-objects/pages/customerPages/home.page";
import { EmployeePage } from "../support/page-objects/pages/employeePages/employee.page";
import { JobPage } from "../support/page-objects/pages/jobPages/job.page";

export const test = base.extend<{
  homePage: HomePage;
  customerPage: CustomerPage;
  employeePage: EmployeePage;
  jobPage: JobPage;
}>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
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

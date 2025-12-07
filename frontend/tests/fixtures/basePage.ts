/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import { CustomerPage } from "../support/page-objects/pages/customerPages/customer.page";
import { HomePage } from "../support/page-objects/pages/customerPages/home.page";

export const test = base.extend<{
  homePage: HomePage;
  customerPage: CustomerPage;
}>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  customerPage: async ({ page }, use) => {
    await use(new CustomerPage(page));
  },
});

export const expect = test.expect;

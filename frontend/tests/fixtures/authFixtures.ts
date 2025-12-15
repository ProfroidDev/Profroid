/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from '../fixtures/basePage';
import { customerCreds, employeeCreds, adminCreds } from '../support/data/credentials';
import type { HomePage } from '../support/page-objects/pages/customerPages/home.page';
import type { EmployeeHomePage } from '../support/page-objects/pages/employeePages/home.page';

type CustomerAuthFixtures = {
    loggedInHomePage: HomePage;
};

type EmployeeAuthFixtures = {
    loggedInEmployeeHomePage: EmployeeHomePage;
};

type AdminAuthFixtures = {
    loggedInAdminHomePage: EmployeeHomePage;
};

export const customerTest = base.extend<CustomerAuthFixtures>({
    loggedInHomePage: async ({ loginPage, homePage }, use) => {
        await loginPage.loginAs(customerCreds.email, customerCreds.password);
        await homePage.waitForHomeURL();
        await use(homePage);
    },
});

export const employeeTest = base.extend<EmployeeAuthFixtures>({
    loggedInEmployeeHomePage: async ({ loginPage, employeeHomePage }, use) => {
        await loginPage.loginAs(employeeCreds.email, employeeCreds.password);
        await employeeHomePage.waitForHomeURL();
        await use(employeeHomePage);
    },
});

export const adminTest = base.extend<AdminAuthFixtures>({
    loggedInAdminHomePage: async ({ loginPage, employeeHomePage }, use) => {
        await loginPage.loginAs(adminCreds.email, adminCreds.password);
        await employeeHomePage.waitForHomeURL();
        await use(employeeHomePage);
    },
});

export { expect } from '@playwright/test';



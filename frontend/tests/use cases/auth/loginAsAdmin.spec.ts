import { adminTest as test, expect } from '../../fixtures/authFixtures';

test.describe('Admin Login', () => {
    test('should successfully login as admin', async ({ loggedInAdminHomePage }) => {
        // Admin is already logged in via fixture
        await expect(loggedInAdminHomePage.partLink()).toBeVisible();
    });

    test('should navigate to employee page', async ({ loggedInAdminHomePage }) => {
        await loggedInAdminHomePage.goToEmployees();
        // Add specific assertion for employee page
    });

    test('should navigate to parts page', async ({ loggedInAdminHomePage }) => {
        await loggedInAdminHomePage.goToParts();
        // Add specific assertion for parts page
    });

    test('should navigate to services page', async ({ loggedInAdminHomePage }) => {
        await loggedInAdminHomePage.goToServices();
        // Add specific assertion for services page
    });
});

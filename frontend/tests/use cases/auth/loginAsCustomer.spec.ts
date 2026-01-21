import { customerTest as test, expect } from '../../fixtures/authFixtures';

test.describe('Customer Login', () => {
  test('should access customer dashboard after login', async ({ loggedInHomePage }) => {
    await loggedInHomePage.goto();
    await expect(loggedInHomePage.customerAppointmentLink()).toBeVisible();
  });

  test('should navigate to customers page', async ({ loggedInHomePage }) => {
    await loggedInHomePage.goToCustomerAppointments();
  });

  test('should navigate to services', async ({ loggedInHomePage }) => {
    await loggedInHomePage.goToServices();
  });
});

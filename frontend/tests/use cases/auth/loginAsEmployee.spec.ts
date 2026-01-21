import { employeeTest as test, expect } from '../../fixtures/authFixtures';

test.describe('Employee Login', () => {
  test('should successfully login as employee', async ({ loggedInEmployeeHomePage }) => {
    // Employee is already logged in via fixture
    await expect(loggedInEmployeeHomePage.jobsLink()).toBeVisible();
  });

  test('should navigate to jobs page', async ({ loggedInEmployeeHomePage }) => {
    await loggedInEmployeeHomePage.goToJobs();
    // Add specific assertion for jobs page
  });

  test('should navigate to services page', async ({ loggedInEmployeeHomePage }) => {
    await loggedInEmployeeHomePage.goToServices();
    // Add specific assertion for services page
  });
});

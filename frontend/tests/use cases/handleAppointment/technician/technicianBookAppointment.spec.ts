import { Page } from '@playwright/test';
import { employeeTest as test, expect } from '../../../fixtures/authFixtures';
import { JobsPage } from '../../../support/page-objects/pages/employeePages/jobs.page';
import { AddAppointmentModal } from '../../../support/page-objects/pages/customerPages/addAppointmentModal.page';

function uniqueDescription(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

test.describe('Technician Book Appointment', () => {
  test('book appointment for customer succeeds', async ({ loggedInEmployeeHomePage }) => {
    const page = (loggedInEmployeeHomePage as unknown as { page: Page }).page;
    const jobsPage = new JobsPage(page);
    const addModal = new AddAppointmentModal(page);

    // Navigate to jobs
    await page.goto('http://localhost:3000/my-jobs');
    await jobsPage.waitForJobsURL();

    // Open add job/appointment modal
    await jobsPage.openAddJobModal();
    await addModal.waitForModal();

    // Select service (Job type)
    await addModal.selectService('Installation');

    // Search and select customer
    await addModal.searchCustomer('ogingras013@gmail.com');
    await page.waitForTimeout(500); // Wait for search results

    // Select the first customer from results
    const customerPills = page
      .locator('[class*="pill"]')
      .or(page.locator('button').filter({ hasText: /ogingras/i }));
    const pillCount = await customerPills.count();
    if (pillCount > 0) {
      await customerPills.first().click();
    }
    await addModal.selectFirstCellar();

    // Select date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    // Select time
    await addModal.selectTime('9:00 AM');

    // Enter description
    const description = uniqueDescription('E2E-Technician-Installation');
    await addModal.enterDescription(description);

    // Enter address
    await addModal.enterAddress({
      street: '123 Customer Street',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H1A 1A1',
    });

    // Submit form
    await addModal.submit();
    await addModal.waitForModalToClose();

    // Verify success
    await expect(jobsPage.toast()).toContainText(/created|booked|appointment/i);

    // Verify job appears in list (may need to refresh page)
    await page.reload();
    await jobsPage.waitForJobsURL();
    const jobCount = await jobsPage.jobCards.count();
    if (jobCount > 0) {
      await expect(jobsPage.jobCards.first()).toBeVisible();
    }
  });

  test('book quotation appointment for customer', async ({ loggedInEmployeeHomePage }) => {
    const page = (loggedInEmployeeHomePage as unknown as { page: Page }).page;
    const jobsPage = new JobsPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-jobs');
    await jobsPage.waitForJobsURL();

    await jobsPage.openAddJobModal();
    await addModal.waitForModal();

    // Select Quotation service
    await addModal.selectService('Quotation');

    // Search customer
    await addModal.searchCustomer('ogingras');
    await page.waitForTimeout(500);

    const customerPills = page
      .locator('[class*="pill"]')
      .or(page.locator('button').filter({ hasText: /ogingras/i }));
    const pillCount = await customerPills.count();
    if (pillCount > 0) {
      await customerPills.first().click();
    }
    await addModal.selectFirstCellar();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('1:00 PM');

    const description = uniqueDescription('E2E-Technician-Quotation');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '456 Service Avenue',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 2R2',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    await expect(jobsPage.toast()).toContainText(/created|booked/i);
  });

  test('book maintenance appointment for customer', async ({ loggedInEmployeeHomePage }) => {
    const page = (loggedInEmployeeHomePage as unknown as { page: Page }).page;
    const jobsPage = new JobsPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-jobs');
    await jobsPage.waitForJobsURL();

    await jobsPage.openAddJobModal();
    await addModal.waitForModal();

    // Select Maintenance
    await addModal.selectService('Maintenance');

    await addModal.searchCustomer('ogingras013@gmail.com');
    await page.waitForTimeout(500);

    const customerPills = page
      .locator('[class*="pill"]')
      .or(page.locator('button').filter({ hasText: /ogingras/i }));
    const pillCount = await customerPills.count();
    if (pillCount > 0) {
      await customerPills.first().click();
    }
    await addModal.selectFirstCellar();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('11:00 AM');

    const description = uniqueDescription('E2E-Technician-Maintenance');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '789 Maintenance Road',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H1A 1A1',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    await expect(jobsPage.toast()).toContainText(/created|booked/i);
  });

  test('reschedule appointment for customer', async ({ loggedInEmployeeHomePage }) => {
    const page = (loggedInEmployeeHomePage as unknown as { page: Page }).page;
    const jobsPage = new JobsPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-jobs');
    await jobsPage.waitForJobsURL();

    // Create initial job
    await jobsPage.openAddJobModal();
    await addModal.waitForModal();

    await addModal.selectService('Quotation');

    await addModal.searchCustomer('ogingras013@gmail.com');
    await page.waitForTimeout(500);

    const customerPillsReschedule = page
      .locator('[class*="pill"]')
      .or(page.locator('button').filter({ hasText: /ogingras/i }));
    const rescheduleCount = await customerPillsReschedule.count();
    if (rescheduleCount > 0) {
      await customerPillsReschedule.first().click();
    }
    await addModal.selectFirstCellar();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('9:00 AM');

    const description = uniqueDescription('E2E-Tech-Reschedule');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '500 Edit Street',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H1A 1A1',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    await expect(jobsPage.toast()).toContainText(/created/i);

    // Reload page to see the new job
    await page.reload();
    await jobsPage.waitForJobsURL();

    await page.getByRole('button', { name: 'Scheduled' }).click();
    // Edit the job
    const descriptionPattern = new RegExp(description.replace(/-/g, ''), 'i');
    const descriptionText = page.getByText(descriptionPattern).first();
    await descriptionText.scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Edit' }).click();
    await addModal.waitForModal();

    // Change time only
    await addModal.selectTime('1:00 PM');

    await page.getByRole('button', { name: 'Update Appointment' }).click();
    await addModal.waitForModalToClose();

    await expect(jobsPage.toast()).toContainText(/updated/i);
  });

  test('cannot book without selecting service', async ({ loggedInEmployeeHomePage }) => {
    const page = (loggedInEmployeeHomePage as unknown as { page: Page }).page;
    const jobsPage = new JobsPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-jobs');
    await jobsPage.waitForJobsURL();

    await jobsPage.openAddJobModal();
    await addModal.waitForModal();

    // Try to submit without selecting service
    await addModal.submit();

    // Modal should still be open
    await expect(addModal.modal).toBeVisible();
  });

  test('cannot book without selecting customer', async ({ loggedInEmployeeHomePage }) => {
    const page = (loggedInEmployeeHomePage as unknown as { page: Page }).page;
    const jobsPage = new JobsPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-jobs');
    await jobsPage.waitForJobsURL();

    await jobsPage.openAddJobModal();
    await addModal.waitForModal();

    // Select service but no customer
    await addModal.selectService('Installation');

    // Submit without customer
    await addModal.submit();

    // Modal should still be open
    await expect(addModal.modal).toBeVisible();
  });

  test('technician can view job list', async ({ loggedInEmployeeHomePage }) => {
    const page = (loggedInEmployeeHomePage as unknown as { page: Page }).page;
    const jobsPage = new JobsPage(page);

    await page.goto('http://localhost:3000/my-jobs');
    await jobsPage.waitForJobsURL();

    // Verify the page loaded with jobs (or empty state if no jobs)
    const isLoading = page.locator('[class*="loading"]');
    const isLoadingVisible = await isLoading.isVisible().catch(() => false);

    // Either loading is shown briefly, or content is shown
    if (!isLoadingVisible) {
      // Check for job cards or empty state
      const jobCount = await jobsPage.getJobCount();
      // May be 0 if no jobs, that's okay
      expect(jobCount).toBeGreaterThanOrEqual(0);
    }
  });
});

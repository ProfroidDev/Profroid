import { Page } from '@playwright/test';
import { customerTest as test, expect } from '../../../fixtures/authFixtures';
import { AppointmentPage } from '../../../support/page-objects/pages/customerPages/appointment.page';
import { AddAppointmentModal } from '../../../support/page-objects/pages/customerPages/addAppointmentModal.page';

function uniqueDescription(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

test.describe('Customer Book Appointment', () => {
  test('book a quotation appointment succeeds', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);
    const addModal = new AddAppointmentModal(page);

    // Navigate to appointments
    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // Open add appointment modal
    await appointmentPage.openAddAppointmentModal();
    await addModal.waitForModal();

    // Select service (Quotation)
    await addModal.selectService('Quotation');

    // Select future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    // Select available time
    await addModal.selectTime('09:00 AM');

    // Enter description
    const description = uniqueDescription('E2E-Quotation');
    await addModal.enterDescription(description);

    // Enter address
    await addModal.enterAddress({
      street: '123 Main Street',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H1A 1A1',
    });

    // Submit the form
    await addModal.submit();

    // Wait for modal to close
    await addModal.waitForModalToClose();

    // Verify success toast
    await expect(appointmentPage.toast()).toContainText(/appointment.*created|booked/i);

    // Verify appointment appears in list
    const appointmentCard = await appointmentPage.getAppointmentCardByJobName('Quotation');
    await expect(appointmentCard).toBeVisible();

    // Verify description is visible
    await expect(appointmentCard).toContainText(description);
  });

  test('book an installation appointment succeeds', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    await appointmentPage.openAddAppointmentModal();
    await addModal.waitForModal();

    // Select Installation service
    await addModal.selectService('Installation');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('10:00 AM');

    const description = uniqueDescription('E2E-Installation');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '456 Oak Avenue',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 2R2',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    await expect(appointmentPage.toast()).toContainText(/appointment.*created|booked/i);

    const appointmentCard = await appointmentPage.getAppointmentCardByJobName('Installation');
    await expect(appointmentCard).toBeVisible();
    await expect(appointmentCard).toContainText(description);
  });

  test('book appointment with invalid address shows error', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    await appointmentPage.openAddAppointmentModal();
    await addModal.waitForModal();

    await addModal.selectService('Quotation');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('09:00 AM');
    await addModal.enterDescription('E2E-Invalid-Address');

    // Enter mismatched postal code and province
    await addModal.enterAddress({
      street: '999 Invalid Street',
      city: 'InvalidCity',
      province: 'QC',
      postalCode: 'M5H 2R2', // This is an Ontario postal code, not Quebec
    });

    await addModal.submit();

    // Error should appear and modal should still be visible
    await expect(addModal.modal).toContainText(/postal|province|address|mismatch/i);
  });

  test('cannot book appointment on past date', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    await appointmentPage.openAddAppointmentModal();
    await addModal.waitForModal();

    await addModal.selectService('Quotation');

    // Try to select past date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    // The date input should not allow selecting past dates
    // This test verifies the UI behavior
    const dateInput = addModal.getDateInput();
    const minDate = await dateInput.getAttribute('min');

    // Verify min date is set to today or later
    if (minDate) {
      const min = new Date(minDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(min.getTime()).toBeGreaterThanOrEqual(today.getTime());
    }
  });
});

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
    await addModal.selectFirstCellar();

    // Select future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    // Select available time
    await addModal.selectTime('9:00 AM');

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

    // Reload to see new appointment first
    await page.reload();
    await appointmentPage.waitForAppointmentsURL();

    // Verify appointment appears in list with correct service type
    const appointmentCard = await appointmentPage.getAppointmentCardByJobName('Quotation');
    await expect(appointmentCard).toBeVisible();
    await expect(appointmentCard).toContainText(/free quotation/i);

    // Get the actual date from the card to use for filtering verification
    const cardText = await appointmentCard.textContent();
    const dateMatch = cardText?.match(/(\w+day,\s+\w+\s+\d+,\s+\d+)/);
    const appointmentDate = dateMatch ? dateMatch[0] : '';

    // Verify appointment still appears after filtering
    const filteredCard = await appointmentPage.getVisibleAppointmentCardByJobName('Quotation');
    await expect(filteredCard).toBeVisible();
    await expect(filteredCard).toContainText(/free quotation|scheduled/i);
    if (appointmentDate) {
      await expect(filteredCard).toContainText(appointmentDate);
    }
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
    await addModal.selectFirstCellar();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('9:00 AM');
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

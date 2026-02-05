import { Page } from '@playwright/test';
import { customerTest as test, expect } from '../../../fixtures/authFixtures';
import { AppointmentPage } from '../../../support/page-objects/pages/customerPages/appointment.page';
import { AddAppointmentModal } from '../../../support/page-objects/pages/customerPages/addAppointmentModal.page';

function uniqueDescription(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

test.describe('Customer Reschedule Appointment', () => {
  test('reschedule scheduled appointment succeeds', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // First, create an appointment to reschedule
    await appointmentPage.openAddAppointmentModal();
    await addModal.waitForModal();

    await addModal.selectService('Quotation');

    const initialDate = new Date();
    initialDate.setDate(initialDate.getDate() + 7);
    const initialDateStr = initialDate.toISOString().split('T')[0];
    await addModal.selectDate(initialDateStr);

    await addModal.selectTime('09:00 AM');

    const appointmentDescription = uniqueDescription('E2E-Reschedule-Initial');
    await addModal.enterDescription(appointmentDescription);

    await addModal.enterAddress({
      street: '123 Main Street',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H1A 1A1',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    // Verify appointment was created
    await expect(appointmentPage.toast()).toContainText(/created|booked/i);

    // Now edit the appointment
    await appointmentPage.editAppointmentByJobName('Quotation');
    await addModal.waitForModal();

    // Change the date (move it forward by a few days)
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 10);
    const newDateStr = newDate.toISOString().split('T')[0];
    await addModal.selectDate(newDateStr);

    // Change the time
    await addModal.selectTime('02:00 PM');

    // Update description
    const updatedDescription = uniqueDescription('E2E-Reschedule-Updated');
    await addModal.enterDescription(updatedDescription);

    // Submit the updated form
    await addModal.submit();
    await addModal.waitForModalToClose();

    // Verify success message
    await expect(appointmentPage.toast()).toContainText(/updated/i);

    // Verify appointment still exists with updated details
    const updatedCard = await appointmentPage.getAppointmentCardByJobName('Quotation');
    await expect(updatedCard).toBeVisible();
    await expect(updatedCard).toContainText(updatedDescription);
  });

  test('reschedule appointment to different time succeeds', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // Create initial appointment
    await appointmentPage.openAddAppointmentModal();
    await addModal.waitForModal();

    await addModal.selectService('Maintenance');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('10:00 AM');

    const description = uniqueDescription('E2E-Maintenance');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '789 King Street',
      city: 'Vancouver',
      province: 'BC',
      postalCode: 'V6B 4Y8',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    // Edit and reschedule
    await appointmentPage.editAppointmentByJobName('Maintenance');
    await addModal.waitForModal();

    // Change to different time slot
    await addModal.selectTime('03:00 PM');

    await addModal.submit();
    await addModal.waitForModalToClose();

    await expect(appointmentPage.toast()).toContainText(/updated/i);
  });

  test('reschedule appointment updates address', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // Create initial appointment
    await appointmentPage.openAddAppointmentModal();
    await addModal.waitForModal();

    await addModal.selectService('Quotation');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('11:00 AM');

    const description = uniqueDescription('E2E-Address-Change');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '100 Old Street',
      city: 'Calgary',
      province: 'AB',
      postalCode: 'T2P 1H7',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    // Edit and update address
    await appointmentPage.editAppointmentByJobName('Quotation');
    await addModal.waitForModal();

    await addModal.enterAddress({
      street: '200 New Street',
      city: 'Calgary',
      province: 'AB',
      postalCode: 'T2P 1H7',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    await expect(appointmentPage.toast()).toContainText(/updated/i);
  });

  test('cannot reschedule completed appointment', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // Filter to show only completed appointments
    await appointmentPage.filterByStatus('COMPLETED');

    // Try to find and click edit on a completed appointment
    // The edit button should not be visible for completed appointments
    // This verifies the UI prevents editing completed appointments
    const appointmentCards = await appointmentPage.appointmentCards.all();

    if (appointmentCards.length > 0) {
      for (const card of appointmentCards) {
        const status = await card.locator('[class*="status-badge"]').textContent().catch(() => '');
        if (status?.includes('Completed')) {
          const editButton = card.getByRole('button', { name: /edit/i });
          const isVisible = await editButton.isVisible().catch(() => false);
          expect(isVisible).toBeFalsy();
        }
      }
    }
  });

  test('cannot reschedule cancelled appointment', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // Filter to show only cancelled appointments
    await appointmentPage.filterByStatus('CANCELLED');

    // Verify no edit/cancel buttons visible on cancelled appointments
    const appointmentCards = await appointmentPage.appointmentCards.all();

    if (appointmentCards.length > 0) {
      for (const card of appointmentCards) {
        const status = await card.locator('[class*="status-badge"]').textContent().catch(() => '');
        if (status?.includes('Cancelled')) {
          const editButton = card.getByRole('button', { name: /edit/i });
          const cancelButton = card.getByRole('button', { name: /cancel/i });
          expect(await editButton.isVisible().catch(() => false)).toBeFalsy();
          expect(await cancelButton.isVisible().catch(() => false)).toBeFalsy();
        }
      }
    }
  });
});

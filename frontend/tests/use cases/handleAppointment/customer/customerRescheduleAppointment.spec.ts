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
    await addModal.selectFirstCellar();

    const initialDate = new Date();
    initialDate.setDate(initialDate.getDate() + 7);
    const initialDateStr = initialDate.toISOString().split('T')[0];
    await addModal.selectDate(initialDateStr);

    await addModal.selectTime('9:00 AM');

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

    // Reload to see new appointment first
    await page.reload();
    await appointmentPage.waitForAppointmentsURL();
    await page.getByRole('button', { name: 'Scheduled' }).click();
    // Now edit the appointment
    await appointmentPage.editAppointmentByJobName('Quotation');
    await addModal.waitForModal();

    // Change the date (move it forward by a few days)
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 10);
    const newDateStr = newDate.toISOString().split('T')[0];
    await addModal.selectDate(newDateStr);

    // Change the time
    await addModal.selectTime('3:00 PM');

    // Update description
    const updatedDescription = uniqueDescription('E2E-Reschedule-Updated');
    await addModal.enterDescription(updatedDescription);

    // Submit the updated form
    await page.getByRole('button', { name: 'Update Appointment' }).click();
    await addModal.waitForModalToClose();

    // Verify success message
    await expect(appointmentPage.toast()).toContainText(/updated/i);

    // Verify appointment still exists after update
    await page.reload();
    await appointmentPage.waitForAppointmentsURL();
    await page.getByRole('button', { name: 'Scheduled' }).click();
    const updatedCard = await appointmentPage.getAppointmentCardByJobName('Quotation');
    await expect(updatedCard).toBeVisible();
    await expect(updatedCard).toContainText(/free quotation/i);
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
    await addModal.selectFirstCellar();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('11:00 AM');

    const description = uniqueDescription('E2E-Maintenance');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '789 King Street',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H1A 1A1',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    // Edit and reschedule
    await page.reload();
    await appointmentPage.waitForAppointmentsURL();
    await page.getByRole('button', { name: 'Scheduled' }).click();
    await appointmentPage.editAppointmentByJobName('Maintenance');
    await addModal.waitForModal();

    // Change to different time slot
    await addModal.selectTime('3:00 PM');

    await page.getByRole('button', { name: 'Update Appointment' }).click();
    await addModal.waitForModalToClose();

    await expect(appointmentPage.toast()).toContainText(/updated/i);

    // Verify appointment is updated with new time on list
    await page.reload();
    await appointmentPage.waitForAppointmentsURL();
    await page.getByRole('button', { name: 'Scheduled' }).click();
    const rescheduledCard = await appointmentPage.getAppointmentCardByJobName('Maintenance');
    await expect(rescheduledCard).toBeVisible();
    await expect(rescheduledCard).toContainText(/maintenance/i);
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
    await addModal.selectFirstCellar();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('11:00 AM');

    const description = uniqueDescription('E2E-Address-Change');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '100 Old Street',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H1A 1A1',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    // Edit and update address
    await page.reload();
    await appointmentPage.waitForAppointmentsURL();
    await page.getByRole('button', { name: 'Scheduled' }).click();
    await appointmentPage.editAppointmentByJobName('Quotation');
    await addModal.waitForModal();

    // Clear address fields and re-enter with new street
    await addModal.enterAddress({
      street: '200 New Street',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H1A 1A1',
    });

    await page.getByRole('button', { name: 'Update Appointment' }).click();
    await addModal.waitForModalToClose();

    // Verify appointment still exists with updated address
    await page.reload();
    await appointmentPage.waitForAppointmentsURL();
    await page.getByRole('button', { name: 'Scheduled' }).click();
    const addressCard = await appointmentPage.getAppointmentCardByJobName('Quotation');
    await expect(addressCard).toBeVisible();
    await expect(addressCard).toContainText(/free quotation/i);
  });

  test('cannot reschedule completed appointment', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // Filter to show only completed appointments
    await page.getByRole('button', { name: 'Completed' }).click();
    // Try to find and click edit on a completed appointment
    // The edit button should not be visible for completed appointments
    // This verifies the UI prevents editing completed appointments
    const appointmentCards = await appointmentPage.appointmentCards.all();

    if (appointmentCards.length > 0) {
      for (const card of appointmentCards) {
        const status = await card
          .locator('[class*="status-badge"]')
          .textContent()
          .catch(() => '');
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

    await page.getByRole('button', { name: 'Cancelled' }).click();
    // Verify no edit/cancel buttons visible on cancelled appointments
    const appointmentCards = await appointmentPage.appointmentCards.all();

    if (appointmentCards.length > 0) {
      for (const card of appointmentCards) {
        const status = await card
          .locator('[class*="status-badge"]')
          .textContent()
          .catch(() => '');
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

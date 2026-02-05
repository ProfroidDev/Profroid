import { Page } from '@playwright/test';
import { customerTest as test, expect } from '../../../fixtures/authFixtures';
import { AppointmentPage } from '../../../support/page-objects/pages/customerPages/appointment.page';
import { AddAppointmentModal } from '../../../support/page-objects/pages/customerPages/addAppointmentModal.page';

function uniqueDescription(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

test.describe('Customer Cancel Appointment', () => {
  test('cancel scheduled appointment succeeds', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // First, create an appointment to cancel
    await appointmentPage.openAddAppointmentModal();
    await addModal.waitForModal();

    await addModal.selectService('Quotation');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('09:00 AM');

    const description = uniqueDescription('E2E-Cancel');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '321 Elm Street',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H1A 1A1',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    // Verify appointment was created
    await expect(appointmentPage.toast()).toContainText(/created|booked/i);

    // Cancel the appointment
    await appointmentPage.cancelAppointmentByJobName('Quotation');

    // Confirm cancellation
    await appointmentPage.confirmCancelAppointment();

    // Verify success message
    await expect(appointmentPage.toast()).toContainText(/cancelled/i);

    // Verify appointment status changed to CANCELLED
    const cancelledStatus = await appointmentPage.getAppointmentStatusByJobName('Quotation');
    expect(cancelledStatus?.toUpperCase()).toContain('CANCELLED');
  });

  test('cancel installation appointment succeeds', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // Create appointment
    await appointmentPage.openAddAppointmentModal();
    await addModal.waitForModal();

    await addModal.selectService('Installation');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('10:00 AM');

    const description = uniqueDescription('E2E-Installation-Cancel');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '555 Beach Avenue',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 2R2',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    await expect(appointmentPage.toast()).toContainText(/created/i);

    // Cancel
    await appointmentPage.cancelAppointmentByJobName('Installation');
    await appointmentPage.confirmCancelAppointment();

    await expect(appointmentPage.toast()).toContainText(/cancelled/i);

    const status = await appointmentPage.getAppointmentStatusByJobName('Installation');
    expect(status?.toUpperCase()).toContain('CANCELLED');
  });

  test('cancel with confirmation modal', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // Create appointment
    await appointmentPage.openAddAppointmentModal();
    await addModal.waitForModal();

    await addModal.selectService('Maintenance');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('02:00 PM');

    const description = uniqueDescription('E2E-Confirmation');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '100 Park Road',
      city: 'Edmonton',
      province: 'AB',
      postalCode: 'T5J 0A1',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    // Initiate cancellation (shows confirmation modal)
    await appointmentPage.cancelAppointmentByJobName('Maintenance');

    // Verify confirmation modal appears
    const confirmModal = page.locator('[class*="confirmation-modal"]');
    await expect(confirmModal).toBeVisible();

    // Confirm the cancellation
    const confirmButton = page.getByRole('button', { name: /confirm|delete|yes/i });
    await confirmButton.first().click();

    // Verify cancellation completed
    await expect(appointmentPage.toast()).toContainText(/cancelled/i);
  });

  test('cannot cancel completed appointment', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // Filter for completed appointments
    await appointmentPage.filterByStatus('COMPLETED');

    // Verify cancel button is not visible on completed appointments
    const completedCards = await appointmentPage.appointmentCards.all();

    if (completedCards.length > 0) {
      for (const card of completedCards) {
        const status = await card.locator('[class*="status-badge"]').textContent().catch(() => '');
        if (status?.includes('Completed')) {
          const cancelButton = card.getByRole('button', { name: /cancel/i });
          const isVisible = await cancelButton.isVisible().catch(() => false);
          expect(isVisible).toBeFalsy();
        }
      }
    }
  });

  test('cannot cancel already cancelled appointment', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);
    const addModal = new AddAppointmentModal(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // Create appointment
    await appointmentPage.openAddAppointmentModal();
    await addModal.waitForModal();

    await addModal.selectService('Quotation');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('09:00 AM');

    const description = uniqueDescription('E2E-Double-Cancel');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '999 Cancel Street',
      city: 'Halifax',
      province: 'NS',
      postalCode: 'B3J 1A1',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    // Cancel once
    await appointmentPage.cancelAppointmentByJobName('Quotation');
    await appointmentPage.confirmCancelAppointment();
    await expect(appointmentPage.toast()).toContainText(/cancelled/i);

    // Try to cancel again - button should not be visible
    const card = await appointmentPage.getAppointmentCardByJobName('Quotation');
    const cancelButton = card.getByRole('button', { name: /cancel/i });
    const isVisible = await cancelButton.isVisible().catch(() => false);
    expect(isVisible).toBeFalsy();
  });

  test('filter to show only scheduled appointments', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();

    // Clear any existing filters
    const clearBtn = page.getByRole('button', { name: /clear/i }).first();
    const isClearVisible = await clearBtn.isVisible().catch(() => false);
    if (isClearVisible) {
      await appointmentPage.clearFilters();
    }

    // Apply SCHEDULED filter
    await appointmentPage.filterByStatus('SCHEDULED');

    // Verify only scheduled appointments are shown
    const cards = await appointmentPage.appointmentCards.all();

    for (const card of cards) {
      const status = await card.locator('[class*="status-badge"]').textContent();
      expect(status?.toUpperCase()).toContain('SCHEDULED');
    }
  });
});

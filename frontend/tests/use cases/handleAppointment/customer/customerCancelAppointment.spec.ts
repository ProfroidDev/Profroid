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
    await addModal.selectFirstCellar();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('9:00 AM');

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

    // Reload to see new appointment
    await page.reload();
    await appointmentPage.waitForAppointmentsURL();

    await page.getByRole('button', { name: 'Scheduled' }).click();
    // Verify appointment appears and is scheduled
    const appointmentCard = await appointmentPage.getAppointmentCardByJobName('Quotation');
    await expect(appointmentCard).toBeVisible();
    await expect(appointmentCard).toContainText(/scheduled/i);

    // Extract the date from the appointment card to verify specific appointment later
    const cardText = await appointmentCard.textContent();
    const dateMatch = cardText?.match(/(\w+day,\s+\w+\s+\d+,\s+\d+)/);
    const appointmentDate = dateMatch ? dateMatch[0] : '';

    // Cancel the appointment
    await appointmentPage.cancelAppointmentByJobName('Quotation');

    // Verify confirmation modal appears and click Cancel button
    const confirmModal = page.locator('.confirmation-modal-container');
    await expect(confirmModal).toBeVisible();

    // Click the Cancel button inside the modal
    const cancelButton = confirmModal.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    // Verify success message
    await expect(appointmentPage.toast()).toContainText(/cancelled/i);

    // Reload and filter by SCHEDULED to verify appointment is no longer scheduled
    await page.reload();
    await appointmentPage.waitForAppointmentsURL();

    // Filter by SCHEDULED status
    await page.getByRole('button', { name: 'Scheduled' }).click();
    await page.waitForLoadState('networkidle');

    // Verify the cancelled appointment is NOT in the scheduled list
    const scheduledCards = await page.locator('.appointment-card', { hasText: /Quotation/i }).all();
    for (const card of scheduledCards) {
      const text = await card.textContent();
      // Ensure the cancelled appointment (with matching date) is not in scheduled list
      expect(text?.includes(appointmentDate)).toBeFalsy();
    }
  });

  test('cannot cancel completed appointment', async ({ loggedInHomePage }) => {
    const page = (loggedInHomePage as unknown as { page: Page }).page;
    const appointmentPage = new AppointmentPage(page);

    await page.goto('http://localhost:3000/my-appointments');
    await appointmentPage.waitForAppointmentsURL();
    await page.getByRole('button', { name: 'Completed' }).click();
    // Filter for completed appointments
    await page.getByRole('button', { name: 'Completed' }).click();
    // Verify cancel button is not visible on completed appointments
    const completedCards = await appointmentPage.appointmentCards.all();

    if (completedCards.length > 0) {
      for (const card of completedCards) {
        const status = await card
          .locator('[class*="status-badge"]')
          .textContent()
          .catch(() => '');
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
    await addModal.selectFirstCellar();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await addModal.selectDate(dateStr);

    await addModal.selectTime('9:00 AM');

    const description = uniqueDescription('E2E-Double-Cancel');
    await addModal.enterDescription(description);

    await addModal.enterAddress({
      street: '999 Cancel Street',
      city: 'Halifax',
      province: 'QC',
      postalCode: 'H1A 1A1',
    });

    await addModal.submit();
    await addModal.waitForModalToClose();

    // Cancel once
    await page.reload();
    await appointmentPage.waitForAppointmentsURL();
    await page.getByRole('button', { name: 'Scheduled' }).click();
    const visibleCard = await appointmentPage.getVisibleAppointmentCardByJobName('Quotation');
    const visibleCancelButton = visibleCard.getByRole('button', { name: /cancel/i });
    await visibleCancelButton.click();
    const confirmModal = page.locator('.confirmation-modal-container');
    await expect(confirmModal).toBeVisible();
    const confirmCancelButton = confirmModal.getByRole('button', { name: /cancel/i });
    await confirmCancelButton.click();
    await expect(appointmentPage.toast()).toContainText(/cancelled/i);

    // Filter to cancelled appointments and ensure no cancel button is visible
    await page.reload();
    await appointmentPage.waitForAppointmentsURL();
    await page.getByRole('button', { name: 'Cancelled' }).click();
    const cancelledCard = await appointmentPage.getVisibleAppointmentCardByJobName('Quotation');
    const cancelButton = cancelledCard.getByRole('button', { name: /cancel/i });
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
    await page.getByRole('button', { name: 'Scheduled' }).click();

    // Verify only scheduled appointments are shown
    const cards = await appointmentPage.appointmentCards.all();

    for (const card of cards) {
      const status = await card.locator('[class*="status-badge"]').textContent();
      expect(status?.toUpperCase()).toContain('SCHEDULED');
    }
  });
});

import { Page } from '@playwright/test';
import { adminTest as test, expect } from '../../fixtures/authFixtures';
import { InventoryPage } from '../../support/page-objects/pages/inventory.page';

function uniqueName(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

test.describe('Manage Inventory', () => {
  test('update minimum quantity (thresholds) succeeds', async ({ loggedInAdminHomePage }) => {
    const page = (loggedInAdminHomePage as unknown as { page: Page }).page;
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.goto();
    await inventoryPage.waitForInventoryURL();

    const partName = uniqueName('E2E-Part');

    await inventoryPage.addPart({
      name: partName,
      category: 'Compressors',
      quantity: 12,
      price: 49.99,
      supplier: 'E2E Supplier',
      lowStockThreshold: 5,
      outOfStockThreshold: 1,
      highStockThreshold: 50,
    });

    await expect(inventoryPage.toast()).toContainText(/Part added successfully/i);

    await inventoryPage.openEditModal('E2E');
    await inventoryPage.updateThresholds({
      lowStockThreshold: 7,
      outOfStockThreshold: 2,
      highStockThreshold: 60,
    });

    await expect(inventoryPage.toast()).toContainText(/Part updated successfully/i);

    await inventoryPage.openEditModal('E2E');
    await expect(page.locator('#edit-low-threshold')).toHaveValue('7');
    await expect(page.locator('#edit-out-threshold')).toHaveValue('2');
    await expect(page.locator('#edit-high-threshold')).toHaveValue('60');
  });

  test('export parts to CSV succeeds', async ({ loggedInAdminHomePage }) => {
    const page = (loggedInAdminHomePage as unknown as { page: Page }).page;
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.goto();
    await inventoryPage.waitForInventoryURL();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      inventoryPage.exportAllToCsv(),
    ]);

    expect(download.suggestedFilename()).toMatch(/inventory_\d{4}-\d{2}-\d{2}\.csv/i);
    await expect(inventoryPage.toast()).toContainText(/Exported .* parts to CSV/i);
  });
});

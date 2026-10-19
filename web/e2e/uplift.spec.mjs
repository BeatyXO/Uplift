import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const wallet = '0x1234567890123456789012345678901234567890';

async function installWalletMock(page) {
  await page.addInitScript((address) => {
    if (!window.localStorage.getItem('uplift.testWalletCounts')) {
      window.localStorage.setItem('uplift.testWalletCounts', JSON.stringify({ eth_accounts: 0, eth_requestAccounts: 0 }));
    }
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => window.localStorage.setItem('uplift.testClipboard', value),
        readText: async () => window.localStorage.getItem('uplift.testClipboard') || '',
      },
    });
    window.ethereum = {
      request: async ({ method }) => {
        const current = JSON.parse(window.localStorage.getItem('uplift.testWalletCounts') || '{}');
        if (method in current) current[method] += 1;
        window.localStorage.setItem('uplift.testWalletCounts', JSON.stringify(current));
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [address];
        if (method === 'eth_chainId') return '0xf22f';
        throw new Error(`Unexpected wallet method: ${method}`);
      },
      on() {}, removeListener() {},
    };
  }, wallet);
}

async function screenshot(page, name) {
  await mkdir('test-results/screenshots', { recursive: true });
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

test('desktop dashboard shows real empty chain state and blush identity', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page).toHaveTitle(/Uplift/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Good intentions');
  await expect(page.getByText('No live programs yet')).toBeVisible();
  await expect(page.getByText('No fabricated contracts or sample impact metrics are shown.')).toBeVisible();
  const hero = await page.locator('.hero').evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(hero).toContain('radial-gradient');
  await screenshot(page, 'desktop-dashboard');
});

test('375px mobile navigation opens the registry without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.locator('.mobile-menu').click();
  await expect(page.locator('.sidebar')).toHaveClass(/opened/);
  await page.getByRole('button', { name: /Impact programs/ }).click();
  await expect(page.getByRole('heading', { name: 'Explore programs' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await screenshot(page, 'mobile-registry');
});

test('wallet opt-in restores with eth_accounts, copies address, and disconnects locally', async ({ page }) => {
  await installWalletMock(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Connect wallet' }).click();
  const walletButton = page.locator('.wallet-button');
  await expect(walletButton).not.toContainText('Connect wallet');
  await page.reload();
  await expect(walletButton).not.toContainText('Connect wallet');
  const restored = JSON.parse(await page.evaluate(() => localStorage.getItem('uplift.testWalletCounts')));
  expect(restored.eth_requestAccounts).toBe(1);
  expect(restored.eth_accounts).toBeGreaterThan(0);
  await walletButton.click();
  await expect(page.getByRole('menu')).toContainText(wallet);
  const copyAddress = page.getByRole('menuitem', { name: 'Copy address' });
  await copyAddress.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Copied!' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(wallet);
  const disconnect = page.getByRole('menuitem', { name: 'Disconnect' });
  await disconnect.focus();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => localStorage.getItem('uplift.wallet.optin'))).toBeNull();
  const beforeReload = JSON.parse(await page.evaluate(() => localStorage.getItem('uplift.testWalletCounts')));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Connect wallet' })).toBeVisible();
  const afterReload = JSON.parse(await page.evaluate(() => localStorage.getItem('uplift.testWalletCounts')));
  expect(afterReload.eth_requestAccounts).toBe(beforeReload.eth_requestAccounts);
});




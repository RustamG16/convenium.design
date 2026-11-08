import { expect, test, type Page } from '@playwright/test';

/**
 * v2 keyboard walk (re-review v2, "still no keyboard walk"): Tab through the Regatta setup and results,
 * the Forge and the Bridge with its tuning card. Every stop must be a visible control with a visible
 * focus indicator: an outline on the control, or — for a native input styled through its label or the
 * span after it — on that visible host. And a race can be started and read with the keyboard alone.
 */
interface Stop {
  id: string;
  label: string;
  visible: boolean;
  indicator: boolean;
}

async function stops(page: Page, count: number): Promise<Stop[]> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
  const out: Stop[] = [];
  for (let i = 0; i < count; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const ring = (n: Element | null | undefined) => {
        if (!n) return false;
        const cs = getComputedStyle(n);
        return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
      };
      const r = el.getBoundingClientRect();
      const self = r.width > 2 && r.height > 2 && getComputedStyle(el).opacity !== '0';
      const host = self ? null : (el.closest('label') ?? el.parentElement);
      const hr = host?.getBoundingClientRect();
      return {
        id: el.getAttribute('data-testid') ?? el.closest('[data-testid]')?.getAttribute('data-testid') ?? el.tagName,
        label: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
        visible: self || (!!hr && hr.width > 2 && hr.height > 2),
        indicator: ring(el) || ring(host) || ring(el.nextElementSibling) || ring(el.closest('label')),
      };
    });
    if (s) out.push(s);
  }
  return out;
}

function expectAllVisible(list: Stop[], where: string) {
  const bad = list.filter((s) => !s.visible || !s.indicator);
  expect(bad, `${where}: stops without a visible focus`).toEqual([]);
}

test('Regatta: every Tab stop shows its focus, and a race runs from the keyboard alone', async ({ page }) => {
  await page.goto('/#/regatta?ships=ss-full-run,ss-abridged');
  await page.getByTestId('rg-start').waitFor();
  const setup = await stops(page, 16);
  expectAllVisible(setup, 'setup');
  expect(setup.map((s) => s.id)).toContain('rg-start');

  // keyboard only: focus Start, press Enter, skip with Enter, and land on the winner sentence
  await page.getByTestId('rg-start').focus();
  await page.keyboard.press('Enter');
  await page.getByTestId('rg-skip').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('rg-head-winner')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('rg-to-results')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('rg-results')).toBeInViewport();

  const results = await stops(page, 20);
  expectAllVisible(results, 'results');
  expect(results.map((s) => s.id)).toEqual(expect.arrayContaining(['rg-live', 'rg-new']));
});

test('Forge and the Bridge tuning card: every Tab stop shows its focus', async ({ page }) => {
  await page.goto('/#/forge');
  await page.getByTestId('forge-agent-rack').first().waitFor();
  expectAllVisible(await stops(page, 24), 'forge');

  await page.goto('/#/ship/ss-full-run/bridge?member=engineer&2d');
  await page.getByTestId('tuning-card').waitFor();
  const bridge = await stops(page, 18);
  expectAllVisible(bridge, 'bridge');
  expect(bridge.map((s) => s.id)).toContain('tune');
});

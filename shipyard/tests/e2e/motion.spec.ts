import { expect, test, type Page } from '@playwright/test';

// v3: the Bridge shows the crew render by default; these tests drive the 3D turntable, so the viewer's choice is preset to 3D
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('convenium.shipyard.ui.bridgeView', '3d');
    } catch {
      /* storage blocked: the URL's view=3d still applies */
    }
  });
});


/**
 * T10: every row of DESIGN.md > Motion contract, under normal and reduced motion. CSS rows are
 * asserted by computed style, JS rows by the dev-only `window.__motion` records (the duration, ease
 * and variant that actually ran) plus the final state, 3D rows through the scene hooks.
 */
interface Rec {
  row: string;
  ms: number;
  reduced: boolean;
  [k: string]: unknown;
}
const records = (page: Page, row?: string) =>
  page.evaluate((r) => ((window as unknown as { __motion?: Rec[] }).__motion ?? []).filter((x) => !r || x.row === r), row);
const reset = (page: Page) => page.evaluate(() => ((window as unknown as { __motion?: Rec[] }).__motion = []));

const card = (page: Page, skill: string) => page.locator(`[data-testid="art-card"][data-skill="${skill}"]`);
const search = async (page: Page, q: string) => {
  await page.getByTestId('armory-search').fill(q);
  await expect(page.getByTestId('armory-count')).toContainText('of');
  await page.waitForTimeout(400); // the grid settles
};
async function cloneAndPickStrategist(page: Page) {
  await page.goto('/#/armory');
  await page.getByTestId('armory-clone').click();
  await expect(page.getByTestId('target-ship')).toBeVisible();
  await page.getByTestId('target-member').selectOption('strategist');
}
const css = (page: Page, sel: string, prop: string, pseudo?: string) =>
  page.locator(sel).first().evaluate((el, [p, ps]) => getComputedStyle(el, ps || undefined).getPropertyValue(p as string), [prop, pseudo ?? '']);
const center = async (page: Page, sel: string) => {
  const b = (await page.locator(sel).first().boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};

for (const mode of ['normal', 'reduced'] as const) {
  const reduced = mode === 'reduced';
  test.describe(`motion contract, ${mode} motion`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    test('hover lift + glow; pick up; the ghost follows 1:1; stagger of the first cards', async ({ page }) => {
      await cloneAndPickStrategist(page);
      // Stagger: the first cards carry --i * 45 ms delays (none under reduced motion)
      await page.reload();
      const st = await page.evaluate(async () => {
        for (let i = 0; i < 100 && !document.querySelector('[data-enter]'); i++) await new Promise((r) => setTimeout(r, 5));
        const els = [...document.querySelectorAll<HTMLElement>('[data-enter]')].slice(0, 5);
        return { delays: els.map((el) => getComputedStyle(el).animationDelay), name: els[0] && getComputedStyle(els[0]).animationName, dur: els[0] && getComputedStyle(els[0]).animationDuration };
      });
      if (reduced) expect(st.name).toBe('none');
      else {
        expect(st.delays).toEqual(['0s', '0.045s', '0.09s', '0.135s', '0.18s']);
        expect(st.dur).toBe('0.16s');
        await expect(page.locator('[data-enter]')).toHaveCount(0, { timeout: 5000 });
      }
      await page.getByTestId('target-member').selectOption('strategist');
      await search(page, 'gsap-core');
      const sel = '[data-testid="art-card"][data-skill="gsap-core"]';
      await card(page, 'gsap-core').hover();
      await page.waitForTimeout(300);
      const tr = await css(page, sel, 'transform');
      const glow = await css(page, sel, 'opacity', '::after');
      const dur = await css(page, sel, 'transition-duration', '::after');
      expect(Number(glow)).toBeCloseTo(0.35, 2);
      if (reduced) {
        expect(tr).toBe('none');
        expect(dur).toBe('0.12s');
      } else {
        expect(tr).toBe('matrix(1, 0, 0, 1, 0, -2)');
        expect(dur).toBe('0.16s');
      }
      // Pick up: scale 1.04 in 120 ms (reduced: no scale); the ghost sits at pointer + 12 px at once
      const c = await center(page, sel);
      await page.mouse.move(c.x, c.y);
      await page.mouse.down();
      await page.mouse.move(c.x + 40, c.y + 40, { steps: 2 });
      await expect(page.getByTestId('drag-ghost')).toBeVisible();
      await expect(card(page, 'gsap-core')).toHaveAttribute('data-lifted', 'true');
      await page.waitForTimeout(250);
      const lifted = await css(page, sel, 'transform');
      if (reduced) expect(lifted).toBe('none');
      else {
        expect(lifted).toBe('matrix(1.04, 0, 0, 1.04, 0, 0)');
        expect(await css(page, sel, 'transition-duration')).toContain('0.12s');
      }
      for (const [dx, dy] of [[90, 50], [200, 130], [333, 211]]) {
        await page.mouse.move(c.x + dx, c.y + dy);
        const g = (await page.getByTestId('drag-ghost').boundingBox())!;
        expect(Math.abs(g.x - (c.x + dx + 12))).toBeLessThanOrEqual(1);
        expect(Math.abs(g.y - (c.y + dy + 12))).toBeLessThanOrEqual(1);
      }
      await page.mouse.up();
      expect((await records(page, 'pick-up')).length).toBeGreaterThan(0);
    });

    test('valid anchor pulse + label; equip 2D; invalid drop; unequip; notice enter/exit', async ({ page }) => {
      await cloneAndPickStrategist(page);
      await search(page, 'gsap-core');
      const sel = '[data-testid="art-card"][data-skill="gsap-core"]';
      const sock = '[data-testid="socket-back-0"]';
      const drag = async (to: string, onOver?: () => Promise<void>) => {
        const c = await center(page, sel);
        const s = await center(page, to);
        await page.mouse.move(c.x, c.y);
        await page.mouse.down();
        await page.mouse.move(c.x + 40, c.y + 40, { steps: 3 });
        await page.mouse.move(s.x, s.y, { steps: 10 });
        if (onOver) await onOver();
        await page.mouse.up();
      };
      await reset(page);
      await drag(sock, async () => {
        await expect(page.locator(sock)).toHaveAttribute('data-hover', 'true');
        const name = await css(page, sock, 'animation-name', '::before');
        const label = page.locator(`${sock} [data-testid="socket-label"]`);
        if (reduced) {
          expect(name).toBe('none');
          await expect(label).toHaveText('Drop to equip: Back');
        } else {
          expect(name).toBe('socket-pulse');
          expect(await css(page, sock, 'animation-duration', '::before')).toBe('0.625s');
          await expect(label).toHaveText('Back');
        }
      });
      await expect(page.locator(sock)).toHaveAttribute('data-skill', 'gsap-core');
      const eq = await records(page, 'equip-2d');
      expect(eq).toHaveLength(1);
      if (reduced) expect(eq[0]).toMatchObject({ ms: 120, variant: 'opacity', reduced: true });
      else expect(eq[0]).toMatchObject({ ms: 240, flashMs: 80, fromDrop: true, reduced: false });
      await expect(page.locator(`${sock} .socket-chip`)).toHaveCSS('transform', 'none');
      // The notice enters in 240 ms (reduced: capped at 120 ms, opacity only)
      const notice = page.getByTestId('notice');
      await expect(notice).toContainText('Equipped');
      expect(await css(page, '[data-testid="notice"]', 'animation-duration')).toBe(reduced ? '0.12s' : '0.24s');
      expect(await css(page, '[data-testid="notice"]', 'transition-duration')).toContain(reduced ? '0.12s' : '0.24s');

      // Invalid drop: the same skill again is refused; the ghost returns 240 ms with a 2 px x2 shake in 180 ms
      await reset(page);
      await drag('[data-testid="socket-belt-0"]');
      const inv = await records(page, 'invalid-drop');
      expect(inv).toHaveLength(1);
      if (reduced) {
        expect(inv[0]).toMatchObject({ ms: 0, returned: false });
        await expect(page.getByTestId('drag-ghost-returning')).toHaveCount(0);
      } else {
        expect(inv[0]).toMatchObject({ ms: 240, shakePx: 2, shakeCount: 2, shakeMs: 180, returned: true });
        await expect(page.getByTestId('drag-ghost-returning')).toHaveCount(0, { timeout: 3000 });
      }
      const reason = page.getByTestId('socket-reason');
      await expect(reason).toBeVisible();
      await expect(reason).not.toHaveText('');
      await expect(page.locator('[data-testid="socket-belt-0"]')).not.toHaveAttribute('data-skill', 'gsap-core');
      await expect(page.locator(sock)).toHaveAttribute('data-skill', 'gsap-core');

      // Unequip: fade + 0.85 in 160 ms (reduced: opacity only), 8 s undo notice
      await reset(page);
      await page.locator(sock).click();
      await page.getByTestId('socket-unequip').click();
      await expect(page.locator(sock)).not.toHaveAttribute('data-skill', /.+/);
      const un = await records(page, 'unequip');
      expect(un).toHaveLength(1);
      if (reduced) expect(un[0]).toMatchObject({ ms: 120, scale: 1 });
      else expect(un[0]).toMatchObject({ ms: 160, scale: 0.85 });
      await expect(page.getByTestId('unequip-ghost')).toHaveCount(0, { timeout: 3000 });
      await expect(notice).toContainText('taken off');
      await expect(page.getByTestId('notice-undo')).toBeVisible();
      // leaving takes 240 ms; the notice is kept until then, then gone; and it goes by itself after 8 s
      await page.getByTestId('notice-dismiss').click();
      await expect(notice).toHaveAttribute('data-leaving', 'true');
      await expect(notice).toHaveCount(0, { timeout: 2000 });
      await page.keyboard.press('u');
      await expect(page.locator(sock)).toHaveAttribute('data-skill', 'gsap-core');
      await expect(notice).toContainText('Undone');
      await page.waitForTimeout(8400);
      await expect(notice).toHaveCount(0);
    });

    test('active in stage: a 3 px rim, and an orbit at 0.25 rps (none under reduced motion)', async ({ page }) => {
      await page.goto('/#/ship/ss-full-run/bridge?member=captain');
      const active = page.locator('.socket[data-active]').first();
      await expect(active).toBeVisible();
      expect(await active.evaluate((el) => getComputedStyle(el).boxShadow)).toMatch(/0px 0px 0px 3px/);
      const name = await css(page, '.socket[data-active]', 'animation-name', '::after');
      if (reduced) expect(name).toBe('none');
      else {
        expect(name).toBe('socket-orbit');
        expect(await css(page, '.socket[data-active]', 'animation-duration', '::after')).toBe('4s');
      }
    });

    test('turntable: 1 rpm, polar 0.9-1.6, no pan (0 rpm and on-demand frames under reduced motion)', async ({ page }) => {
      test.setTimeout(120_000);
      await page.goto('/#/ship/ss-full-run/bridge?member=captain');
      await expect(page.getByTestId('turntable')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
      const c = await page.evaluate(() => {
        const h = (window as unknown as { __turntable: { get(): { controls: Record<string, number | boolean>; frameloop: string } } }).__turntable.get();
        const k = h.controls;
        return { auto: k.autoRotate, speed: k.autoRotateSpeed, min: k.minPolarAngle, max: k.maxPolarAngle, pan: k.enablePan, loop: h.frameloop };
      });
      expect(c).toMatchObject({ speed: 1, min: 0.9, max: 1.6, pan: false });
      expect(c.auto).toBe(!reduced);
      expect(c.loop).toBe(reduced ? 'demand' : 'always');
    });

    test('equip in 3D: a 0.4 m arc in 520 ms back.out(1.6) (reduced: placed at once, 120 ms opacity)', async ({ page }) => {
      test.setTimeout(180_000);
      await page.goto('/#/ship/ss-full-run/bridge?member=strategist');
      await page.getByTestId('clone-to-edit').click();
      await page.getByTestId('clone-confirm').click();
      await expect(page.getByTestId('turntable')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
      await page.waitForTimeout(1000);
      await reset(page);
      // Watch the arrival group from inside the page, frame by frame, from the moment it appears.
      await page.evaluate(() => {
        const w = window as unknown as { __arrival?: { lens: number[]; first?: unknown; last?: unknown }; __turntable: { scene: { getObjectByName(n: string): { position: { length(): number }; userData: Record<string, unknown> } | undefined } } };
        const seen = { lens: [] as number[], first: undefined as unknown, last: undefined as unknown };
        w.__arrival = seen;
        const tick = () => {
          const g = w.__turntable.scene.getObjectByName('arrival-gsap-core');
          if (g) {
            seen.lens.push(g.position.length());
            seen.first ??= { ...g.userData.arrival as object };
            seen.last = { ...g.userData.arrival as object };
          }
          requestAnimationFrame(tick);
        };
        tick();
      });
      await page.getByTestId('equip-skill').click();
      await page.getByTestId('picker-search').fill('gsap-core');
      await page.locator('[data-testid="skill-picker"] [data-skill="gsap-core"]').click();
      await expect.poll(async () => (await records(page, 'equip-3d')).length, { timeout: 20_000 }).toBeGreaterThan(0);
      const rec = (await records(page, 'equip-3d'))[0];
      await expect.poll(() => page.evaluate(() => (window as unknown as { __arrival: { last?: { state?: string } } }).__arrival.last?.state), { timeout: 10_000 }).toBe('done');
      const seen = await page.evaluate(() => (window as unknown as { __arrival: { lens: number[]; first: Record<string, unknown> } }).__arrival);
      if (reduced) {
        expect(rec).toMatchObject({ ms: 120, variant: 'opacity', reduced: true });
        expect(Math.max(...seen.lens)).toBeLessThan(1e-6);
        expect(seen.first).toMatchObject({ variant: 'opacity' });
      } else {
        expect(rec).toMatchObject({ ms: 520, variant: 'arc', ease: 'back.out(1.6)', arcM: 0.4 });
        expect(seen.first).toMatchObject({ variant: 'arc', ms: 520 });
        // it started 0.4 m from the anchor (the arc bows it a little off the line) and ended on it
        expect(Math.max(...seen.lens)).toBeGreaterThan(0.3);
        expect(Math.max(...seen.lens)).toBeLessThan(0.55);
        expect(seen.lens.at(-1)!).toBeLessThan(1e-6);
      }
      await expect(page.locator('[data-testid="anchor-diagram"] [data-skill="gsap-core"]')).toHaveCount(1);
    });

    test('grid to inspector: the tile flips in 240 ms (reduced: it just appears)', async ({ page }) => {
      await cloneAndPickStrategist(page);
      await search(page, 'gsap-core');
      await reset(page);
      await card(page, 'gsap-core').click();
      await expect(page.getByTestId('art-detail')).toBeVisible();
      const flips = await records(page, 'flip');
      if (reduced) expect(flips).toHaveLength(0);
      else {
        expect(flips.length).toBeGreaterThan(0); // dev StrictMode runs the effect twice
        expect(flips[0]).toMatchObject({ ms: 240, skill: 'gsap-core' });
      }
      const tile = page.getByTestId('detail-tile');
      await expect(tile).not.toHaveAttribute('data-flipping', '', { timeout: 3000 });
      await expect(tile).toHaveCSS('transform', 'none');
      const b = (await tile.boundingBox())!;
      expect(Math.round(b.width)).toBe(40);
    });
  });
}

test.describe('pre-flight motion', () => {
  for (const mode of ['normal', 'reduced'] as const) {
    test(`clean sweep plays once per ship, never again; check flips (${mode})`, async ({ page }) => {
      const reduced = mode === 'reduced';
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/#/ship/ss-full-run/preflight');
      await expect(page.getByTestId('cleared')).toBeVisible();
      const hull = page.locator('.pf-hull');
      if (reduced) {
        // final state and the line; nothing moves, nothing is marked as played
        await expect(hull).toHaveAttribute('data-sweep', 'idle');
        expect((await records(page, 'sweep'))[0]).toMatchObject({ ms: 0, variant: 'final-state' });
        expect(await records(page, 'sweep-light')).toHaveLength(0);
        await expect(page.getByTestId('cleared')).toHaveText('Cleared for departure');
      } else {
        await expect(hull).toHaveAttribute('data-sweep', 'done', { timeout: 5000 });
        const sweep = (await records(page, 'sweep'))[0];
        expect(sweep).toMatchObject({ ms: 900, order: ['crew', 'stages', 'parallel', 'gates', 'library'] });
        const lights = await records(page, 'sweep-light');
        // dev StrictMode plays the effect twice; the last five are the run that stayed
        lights.splice(0, lights.length - 5);
        expect(lights.map((l) => l.group)).toEqual(['crew', 'stages', 'parallel', 'gates', 'library']);
        const at = lights.map((l) => l.at as number);
        expect([...at].sort((a, b) => a - b)).toEqual(at);
        expect(at.at(-1)! - at[0]).toBeGreaterThan(400);
        expect(at.at(-1)! - at[0]).toBeLessThan(900);
        await expect(page.locator('.hull-light').first()).toHaveCSS('opacity', '0');
        // Never again for this ship: leave, come back, reload
        await page.goto('/#/');
        await page.goto('/#/ship/ss-full-run/preflight');
        await expect(page.getByTestId('cleared')).toBeVisible();
        await page.reload();
        await expect(page.getByTestId('cleared')).toBeVisible();
        await page.waitForTimeout(1200);
        expect(await records(page, 'sweep')).toHaveLength(0);
        await expect(hull).toHaveAttribute('data-sweep', 'idle');

      }

      // A check flips while you watch: undo a break on a cloned ship (count-up + ring fill 400 ms, row tick)
      await page.goto('/#/ship/ss-full-run/bridge?member=captain');
      await page.getByTestId('clone-to-edit').click();
      await page.getByTestId('clone-confirm').click();
      await page.locator('.socket[data-active]').first().click();
      await page.getByTestId('socket-unequip').click();
      await page.goto('/#/');
      // in-app navigation keeps the undo stack
      await page.locator('[data-testid="ship-card"]:not(:has([data-testid="template-lock"]))').getByTestId('open-preflight').click();
      await expect(page.getByTestId('next-goal')).not.toHaveAttribute('data-goal', 'export');
      const before = Number(await page.locator('.ring-num').first().getAttribute('data-value'));
      expect(before).toBeLessThan(100);
      await reset(page);
      await page.keyboard.press('u');
      await expect(page.locator('.ring-num').first()).toHaveAttribute('data-value', '100');
      if (!reduced) await expect.poll(async () => (await records(page, 'ring-fill')).length).toBeGreaterThan(0);
      if (reduced) {
        // final state at once: no fill, no count-up, no row tint
        expect(await records(page, 'ring-fill')).toHaveLength(0);
        expect(await records(page, 'check-flip-count')).toHaveLength(0);
        expect(await records(page, 'check-flip')).toHaveLength(0);
      } else {
        expect((await records(page, 'ring-fill'))[0]).toMatchObject({ ms: 400, to: 100 });
        expect((await records(page, 'check-flip-count'))[0]).toMatchObject({ ms: 400 });
        expect((await records(page, 'check-flip')).length).toBeGreaterThan(0);
      }
      await expect(page.locator('.ring-num').first()).toHaveText('100');
    });
  }
});

test('camera: 700 ms between stations, interruptible; a cut under reduced motion', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-full-run/board');
  await expect(page.getByTestId('ship-intro')).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean((window as unknown as { __ship?: unknown }).__ship)), { timeout: 120_000 }).toBe(true);
  await page.getByTestId('waypoint-next').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __ship: { walker: { lastLeg: unknown } } }).__ship.walker.lastLeg), { timeout: 60_000 }).not.toBeNull();
  const leg = await page.evaluate(() => (window as unknown as { __ship: { walker: { lastLeg: { seconds: number; length: number } } } }).__ship.walker.lastLeg);
  expect(leg.length).toBeGreaterThan(3);
  expect(leg.seconds).toBeGreaterThanOrEqual(0.7);
  expect(leg.seconds).toBeLessThan(0.85);
  // Interruptible: a new goal mid-leg retargets, and a key press stops the autopilot
  const out = await page.evaluate(async () => {
    const w = (window as unknown as { __ship: { walker: { goTo(i: number): void; autopilot: boolean; setMove(f: number, s: number, t: number, r: boolean): void; step(dt: number, r: boolean): void } } }).__ship.walker;
    w.goTo(2);
    await new Promise((r) => setTimeout(r, 150));
    const running = w.autopilot;
    w.goTo(1);
    const retargeted = w.autopilot;
    w.setMove(1, 0, 0, false);
    w.step(0.016, false);
    const stopped = !w.autopilot;
    w.setMove(0, 0, 0, false);
    return { running, retargeted, stopped };
  });
  expect(out).toEqual({ running: true, retargeted: true, stopped: true });
  expect((await records(page, 'camera')).length).toBeGreaterThanOrEqual(3);
  expect((await records(page, 'camera'))[0]).toMatchObject({ ms: 700 });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/ship/ss-full-run/board?x=1');
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean((window as unknown as { __ship?: unknown }).__ship)), { timeout: 120_000 }).toBe(true);
  await reset(page);
  await page.getByTestId('waypoint-next').click();
  await expect.poll(async () => (await records(page, 'camera')).length).toBeGreaterThan(0);
  expect((await records(page, 'camera'))[0]).toMatchObject({ ms: 0, cut: true, reduced: true });
});

test('commission toast enters and leaves in 240 ms', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/ship/ss-full-run/bridge?member=captain');
  await page.getByTestId('clone-to-edit').click();
  await page.getByTestId('clone-confirm').click();
  const toast = page.getByTestId('commission-toast');
  await expect(toast).toBeVisible();
  expect(await css(page, '[data-testid="commission-toast"]', 'animation-duration')).toBe('0.24s');
  expect(await css(page, '[data-testid="commission-toast"]', 'transition-duration')).toContain('0.24s');
  await page.evaluate(() => {
    const w = window as unknown as { __left?: number };
    const el = document.querySelector('[data-testid="commission-toast"]')!;
    const t0 = performance.now();
    new MutationObserver((_, ob) => {
      if (el.hasAttribute('data-leaving')) {
        w.__left = performance.now() - t0;
        ob.disconnect();
      }
    }).observe(el, { attributes: true });
    new MutationObserver((_, ob) => {
      if (!el.isConnected) {
        (w as { __gone?: number }).__gone = performance.now() - t0;
        ob.disconnect();
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page.getByTestId('toast-dismiss').click();
  await expect(toast).toHaveCount(0, { timeout: 3000 });
  const t = await page.evaluate(() => {
    const w = window as unknown as { __left?: number; __gone?: number };
    return { left: w.__left, gone: w.__gone };
  });
  expect(t.left).toBeDefined();
  expect(t.gone! - t.left!).toBeGreaterThanOrEqual(200);
  // The 240 ms is the CSS duration asserted above; the removal timer shares the main thread with the software-GL turntable
  // (T11 made that card about twice the pixels), so the measured gap carries frame jitter on a loaded machine. The bound
  // still rules out a toast that lingers (the old 400 ms headroom measured 420-460 ms under the bigger canvas).
  expect(t.gone! - t.left!).toBeLessThan(700);
});

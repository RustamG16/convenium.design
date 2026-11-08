/** v2 finish review M3: the race reads in score order — the course is 100 points long. */
import { describe, expect, it } from 'vitest';
import { arenaExtent, arenaZoom, buoyX, FINISH_X, hullScale, hullX, START_X } from '../../src/scene/Arena';

describe('arena camera', () => {
  it('fits the whole course at any stage aspect, whichever side binds', () => {
    for (const px of [{ width: 1392, height: 300 }, { width: 340, height: 168 }, { width: 600, height: 600 }]) {
      const z = arenaZoom(px, 4);
      const e = arenaExtent(4);
      expect(e.width * z).toBeLessThanOrEqual(px.width + 1e-6);
      expect(e.height * z).toBeLessThanOrEqual(px.height + 1e-6);
    }
  });
});

describe('arena course', () => {
  it('puts a higher score further along at every moment of the reveal, and 100 points on the finish line', () => {
    for (const p of [0.1, 0.5, 0.9, 1]) expect(hullX(0.893, p)).toBeGreaterThan(hullX(0.785, p));
    expect(hullX(1, 1)).toBeCloseTo(FINISH_X);
    expect(hullX(0.9, 0)).toBeCloseTo(START_X);
  });

  it('spreads a ship’s buoys over the stretch it reaches, the last one where it finishes', () => {
    expect(buoyX(15, 16, 0.893)).toBeCloseTo(hullX(0.893, 1));
    expect(buoyX(0, 8, 0.785)).toBeLessThan(buoyX(7, 8, 0.785));
  });

  it('fits a long hull by its length and a wide-winged hull by its beam, so neither crosses into the buoys (re-review v2, m4)', () => {
    // long and narrow: 1.15 long
    expect(hullScale(2, 0.5) * 2).toBeCloseTo(1.15);
    // wider than long: the beam caps it, so its wings stay inside the lane
    const s = hullScale(1, 2);
    // 0.8 wide: half (0.4) stays clear of a gate gem (radius 0.15) at 0.62 on either side
    expect(s * 2).toBeCloseTo(0.8);
    expect(s).toBeLessThan(0.62 - 0.15);
    expect(s * 1).toBeLessThan(1.15);
  });
});

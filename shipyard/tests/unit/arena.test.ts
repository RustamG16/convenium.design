/** v2 finish review M3: the race reads in score order — the course is 100 points long. */
import { describe, expect, it } from 'vitest';
import { buoyX, FINISH_X, hullScale, hullX, START_X } from '../../src/scene/Arena';

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
    expect(s * 2).toBeLessThan(0.7);
    expect(s * 1).toBeLessThan(1.15);
  });
});

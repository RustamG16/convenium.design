import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FAMILY_IDS } from '../../src/scene/artifacts/families';
import { FamilyGlyph, GLYPH_FAMILIES } from '../../src/scene/artifacts/glyphs';
import { sheetOrder } from '../../src/scene/artifacts/sheet';

describe('family glyphs', () => {
  it('has one glyph for each of the eleven families', () => {
    expect([...GLYPH_FAMILIES].sort()).toEqual([...FAMILY_IDS].sort());
  });

  for (const family of FAMILY_IDS) {
    it(`${family}: a 24px svg, 1.5px stroke, pigment fill at 0.2, hidden from assistive tech`, () => {
      const html = renderToStaticMarkup(<FamilyGlyph family={family} pigment="#E8C46A" />);
      expect(html).toContain('width="24"');
      expect(html).toContain('height="24"');
      expect(html).toContain('stroke-width="1.5"');
      expect(html).toContain('fill="#E8C46A"');
      expect(html).toContain('fill-opacity="0.2"');
      expect(html).toContain('aria-hidden="true"');
      expect(html).toMatch(/<(path|circle|ellipse|rect)/);
    });
  }
});

describe('the sheet order', () => {
  it('groups by family, then skill id, and does not mutate its input', () => {
    const items = [
      { skill: 'b', family: 'lens', pigment: '#000000' },
      { skill: 'a', family: 'wrench', pigment: '#000000' },
      { skill: 'a', family: 'lens', pigment: '#000000' },
    ];
    const copy = [...items];
    expect(sheetOrder(items).map((i) => `${i.family}:${i.skill}`)).toEqual(['lens:a', 'lens:b', 'wrench:a']);
    expect(items).toEqual(copy);
  });
});

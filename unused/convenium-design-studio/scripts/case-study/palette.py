"""Palette adherence from screenshots.

usage: python palette.py <site-dir> [<site-dir> ...]
For every desktop-*.png / mobile-*.png in a site directory, classify pixels:
  neutral  - low saturation (greys, near-black, near-white)
  on       - chromatic and within distance 60 (CIE-ish Lab) of a palette colour or its tints/shades
  off      - chromatic and far from every palette colour
Reports the share of chromatic pixels that are on-palette, plus the dominant off-palette colours.
Imagery counts too: the brief asked the media itself to obey the palette.
"""
import sys, json, glob, os, colorsys
from PIL import Image

PALETTE = {'hunyadi': (0xE0, 0x9F, 0x3E), 'auburn': (0x9E, 0x2A, 0x2B), 'slate': (0x33, 0x5C, 0x67), 'vanilla': (0xFF, 0xF3, 0xB0)}

def to_lab(rgb):
    def f(c):
        c /= 255
        return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
    r, g, b = (f(v) for v in rgb)
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    g3 = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = g3(x), g3(y), g3(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))

# Tints and shades of each palette colour count as on-palette (lighting varies in photos).
REFS = []
for name, c in PALETTE.items():
    for k in (0.7, 0.85, 1.0):
        REFS.append((name, to_lab(tuple(int(v * k) for v in c))))
    for k in (0.25, 0.5):
        REFS.append((name, to_lab(tuple(int(v + (255 - v) * k) for v in c))))

def chroma_dist(lab_a, lab_b):
    # Weight lightness lower: we care about hue family, photos vary in exposure.
    return ((0.4 * (lab_a[0] - lab_b[0])) ** 2 + (lab_a[1] - lab_b[1]) ** 2 + (lab_a[2] - lab_b[2]) ** 2) ** 0.5

def analyse(path):
    im = Image.open(path).convert('RGB').resize((240, 150))
    counts = {'neutral': 0, 'on': 0, 'off': 0}
    per = {k: 0 for k in PALETTE}
    off_bins = {}
    for rgb in (im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata()):
        h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in rgb))
        if s < 0.25 or l < 0.12 or l > 0.93:
            counts['neutral'] += 1
            continue
        lab = to_lab(rgb)
        name, d = min(((n, chroma_dist(lab, ref)) for n, ref in REFS), key=lambda t: t[1])
        if d < 18:
            counts['on'] += 1
            per[name] += 1
        else:
            counts['off'] += 1
            key = tuple(v // 32 * 32 for v in rgb)
            off_bins[key] = off_bins.get(key, 0) + 1
    return counts, per, off_bins

def main():
    report = {}
    for site in sys.argv[1:]:
        files = sorted(glob.glob(os.path.join(site, 'desktop-*.png')) + glob.glob(os.path.join(site, 'mobile-*.png')))
        tot = {'neutral': 0, 'on': 0, 'off': 0}; per = {k: 0 for k in PALETTE}; off = {}
        for f in files:
            c, p, o = analyse(f)
            for k in tot: tot[k] += c[k]
            for k in per: per[k] += p[k]
            for k, v in o.items(): off[k] = off.get(k, 0) + v
        chromatic = tot['on'] + tot['off']
        top_off = sorted(off.items(), key=lambda kv: -kv[1])[:5]
        report[os.path.basename(site.rstrip('/\\'))] = {
            'screens': len(files),
            'onPaletteShareOfChromatic': round(tot['on'] / chromatic, 3) if chromatic else None,
            'chromaticShareOfPixels': round(chromatic / sum(tot.values()), 3) if sum(tot.values()) else None,
            'paletteMix': {k: round(v / max(1, tot['on']), 3) for k, v in per.items()},
            'topOffPalette': ['#%02X%02X%02X' % k for k, _ in top_off],
        }
    print(json.dumps(report, indent=2))

if __name__ == '__main__':
    main()

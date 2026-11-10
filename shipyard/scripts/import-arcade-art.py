"""v3 space Arcade art: compress the approved concept renders in plan/concepts-v3/ into WebP under
public/media/arcade/ (plan 13 § Art). Run from shipyard/: python scripts/import-arcade-art.py
Needs Pillow. Idempotent; the sources stay untouched."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'plan' / 'concepts-v3'
OUT = ROOT / 'public' / 'media' / 'arcade'
OUT.mkdir(parents=True, exist_ok=True)


def save(im: Image.Image, name: str, q: int = 80) -> None:
    im.save(OUT / name, 'WEBP', quality=q, method=6)
    print(f'{name:28} {im.size[0]}x{im.size[1]}  {(OUT / name).stat().st_size // 1024} KB')


def fit_w(im: Image.Image, w: int) -> Image.Image:
    return im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


# plates
for src, name in [('bg-orbital-dock-21x9', 'plate-dock'), ('bg-race-circuit-21x9', 'plate-race'), ('bg-bridge-21x9', 'plate-bridge')]:
    save(fit_w(Image.open(SRC / 'space' / 'decor' / f'{src}.png').convert('RGB'), 2400), f'{name}.webp', 74)

# ship cutouts, trimmed to their alpha
for sid in ['ss-full-run', 'ss-abridged', 'ss-mobile-retrofit', 'ss-mobile-fleet', 'ss-site-pass']:
    im = Image.open(SRC / 'space' / 'ships' / f'{sid}.png').convert('RGBA')
    im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox())
    save(fit_w(im, 960), f'ship-{sid}.webp', 82)

# crew cutouts (stage art), trimmed
CREW = {'captain': 'captain-oddvar-quill', 'strategist': 'strategist-mira-sondh', 'analyst': 'analyst-oculo-prant', 'critic': 'critic-hesper-grane',
        'producer': 'producer-pip-maravel', 'metrics': 'metrics-ledger-nin', 'gauge': 'gauge-tally-gauge'}
for cid, f in CREW.items():
    im = Image.open(SRC / 'space' / 'crew' / f'{f}.png').convert('RGBA')
    im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox())
    im.thumbnail((768, 768), Image.LANCZOS)
    save(im, f'crew-{cid}.webp', 82)

# the lineup: card crops for all eight, and Wren's stage art (Wren has no single render)
lineup = Image.open(SRC / 'space' / 'crew' / 'lineup-21x9.png').convert('RGB')
K = lineup.width / 2000  # the crop boxes below were read off a 2000-wide view
CARDS = {'captain': (230, 10, 300), 'strategist': (450, 140, 230), 'analyst': (665, 230, 300), 'critic': (905, 30, 260),
         'engineer': (1185, 30, 300), 'producer': (1460, 300, 300), 'metrics': (1660, 140, 220), 'gauge': (1870, 360, 240)}
for cid, (cx, top, w) in CARDS.items():
    h = w * 4 / 3
    box = tuple(round(v * K) for v in (cx - w / 2, top, cx + w / 2, top + h))
    save(lineup.crop(box).resize((360, 480), Image.LANCZOS), f'card-{cid}.webp', 80)

box = tuple(round(v * K) for v in (1000, 30, 1390, 800))
wren = lineup.crop(box).convert('RGBA')
mask = Image.new('L', wren.size, 0)
d = ImageDraw.Draw(mask)
d.ellipse((wren.width * 0.06, -wren.height * 0.3, wren.width * 0.94, wren.height * 1.04), fill=255)
wren.putalpha(mask.filter(ImageFilter.GaussianBlur(wren.width * 0.06)))
wren.thumbnail((768, 768), Image.LANCZOS)
save(wren, 'crew-engineer.webp', 82)

# decor
lau = Image.open(SRC / 'decor' / 'laurel.png').convert('RGBA')
lau = lau.crop(lau.getchannel('A').getbbox())
lau.thumbnail((360, 360), Image.LANCZOS)
save(lau, 'laurel.webp', 85)

thr = Image.open(SRC / 'space' / 'decor' / 'thruster.gif')
frames = []
for i in range(thr.n_frames):
    thr.seek(i)
    frames.append(thr.convert('RGBA').resize((256, 256), Image.LANCZOS))
frames[0].save(OUT / 'thruster.webp', 'WEBP', save_all=True, append_images=frames[1:], duration=thr.info.get('duration', 60), loop=0, quality=70, method=6)
print('thruster.webp', (OUT / 'thruster.webp').stat().st_size // 1024, 'KB')

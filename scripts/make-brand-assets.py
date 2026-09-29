"""
Generates Newzort's app icons, splash images and in-app logos from the
master logo (assets/brand/newzort-logo.webp).

    python scripts/make-brand-assets.py

Outputs go to assets/images/. Re-run after changing the master logo.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "brand" / "newzort-logo.webp"
OUT = ROOT / "assets" / "images"

NAVY = (16, 30, 54)
LIGHT_INK = (238, 240, 242)  # replaces navy on dark backgrounds
WHITE = (255, 255, 255)
DARK_BG = (14, 16, 18)

MARK_ROWS = (330, 705)  # the "NZ" symbol
WORD_ROWS = (760, 950)  # the "Newzort" wordmark


def remove_white_background(img: Image.Image) -> Image.Image:
    """White → transparent, keeping anti-aliased edges smooth (un-blends from white)."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            lightest = min(r, g, b)
            alpha = max(0.0, min(1.0, (250 - lightest) / 130))
            if alpha <= 0:
                px[x, y] = (0, 0, 0, 0)
                continue
            # colour = alpha*fg + (1-alpha)*white  →  solve for fg
            fg = tuple(max(0, min(255, round((c - (1 - alpha) * 255) / alpha))) for c in (r, g, b))
            px[x, y] = (*fg, round(alpha * 255))
    return img


def crop_rows(img: Image.Image, rows: tuple[int, int]) -> Image.Image:
    part = img.crop((0, rows[0], img.width, rows[1]))
    return part.crop(part.getbbox())


def recolor_navy(img: Image.Image, to: tuple[int, int, int]) -> Image.Image:
    """For dark mode: navy parts become light ink; the blue stays."""
    img = img.copy()
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a and b < 140 and r < 80:  # navy-ish, not the bright blue
                px[x, y] = (*to, a)
    return img


def silhouette(img: Image.Image, color=WHITE) -> Image.Image:
    """Single-colour shape (Android themed/monochrome icon)."""
    alpha = img.getchannel("A")
    solid = Image.new("RGBA", img.size, (*color, 255))
    solid.putalpha(alpha)
    return solid


def place(mark: Image.Image, size: int, fraction: float, bg=None) -> Image.Image:
    """Centre `mark` on a size×size canvas, scaled so its longest side = fraction×size."""
    canvas = Image.new("RGBA", (size, size), (*bg, 255) if bg else (0, 0, 0, 0))
    scale = fraction * size / max(mark.size)
    m = mark.resize((round(mark.width * scale), round(mark.height * scale)), Image.LANCZOS)
    canvas.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    return canvas


def main():
    logo = remove_white_background(Image.open(SRC))
    mark = crop_rows(logo, MARK_ROWS)
    mark_dark = recolor_navy(mark, LIGHT_INK)
    full = logo.crop(logo.getbbox())
    full_dark = recolor_navy(full, LIGHT_INK)

    OUT.mkdir(parents=True, exist_ok=True)
    outputs = {
        # App store / iOS icon: full-bleed square, mark on white.
        "icon.png": place(mark, 1024, 0.62, WHITE),
        # Android adaptive icon: the system masks to a circle/squircle, so the
        # mark stays inside the central ~60% "safe zone".
        "android-icon-foreground.png": place(mark, 1024, 0.50),
        "android-icon-background.png": Image.new("RGBA", (1024, 1024), (*WHITE, 255)),
        "android-icon-monochrome.png": place(silhouette(mark), 1024, 0.50),
        # Splash screens (light + dark).
        "splash-icon.png": place(mark, 512, 0.92),
        "splash-icon-dark.png": place(mark_dark, 512, 0.92),
        # Browser tab.
        "favicon.png": place(mark, 64, 0.86, WHITE),
        # In-app logos (transparent).
        "logo-mark.png": place(mark, 512, 1.0),
        "logo-mark-dark.png": place(mark_dark, 512, 1.0),
    }
    for name, image in outputs.items():
        image.save(OUT / name)
        print(f"wrote {name} {image.size}")

    # Full logo keeps its aspect ratio.
    for name, image in (("logo-full.png", full), ("logo-full-dark.png", full_dark)):
        scale = 720 / image.width
        image.resize((720, round(image.height * scale)), Image.LANCZOS).save(OUT / name)
        print(f"wrote {name}")


if __name__ == "__main__":
    main()

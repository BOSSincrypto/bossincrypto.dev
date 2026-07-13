"""Generate og-image.png (1200×630) for BOSSincrypto.dev.

Terminal/hacker aesthetic: dark background, monospace text, neon green accents.
Output: public/og-image.png
"""

import os
from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1200, 630
BG_COLOR = (10, 10, 10)           # #0a0a0a terminal-bg
GREEN = (0, 255, 65)              # #00ff41 terminal-green
AMBER = (255, 176, 0)             # #ffb000 terminal-amber
CYAN = (0, 229, 255)              # #00e5ff terminal-cyan
DIM = (51, 51, 51)                # #333333
WHITE_DIM = (192, 192, 192)       # #c0c0c0

def find_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Find a monospace font, falling back to default."""
    candidates: list[str] = [
        "C:\\Windows\\Fonts\\consola.ttf",
        "C:\\Windows\\Fonts\\cour.ttf",
        "C:\\Windows\\Fonts\\lucon.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def create_og_image() -> None:
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # ── Borders: terminal-style frame ──────────────────
    border_color = (*GREEN, 40)  # low-opacity green border
    draw.rectangle([40, 40, WIDTH - 40, HEIGHT - 40], outline=GREEN, width=2)

    # ── Title bar dots ─────────────────────────────────
    dot_y = 60
    for i, color in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        draw.ellipse([70 + i * 24, dot_y, 70 + i * 24 + 14, dot_y + 14], fill=color)

    # ── Title ──────────────────────────────────────────
    font_title = find_font(48)
    title = "BOSSincrypto.dev"
    draw.text((70, 140), title, fill=GREEN, font=font_title)

    # ── Subtitle ───────────────────────────────────────
    font_sub = find_font(24)
    subtitle = "Project Hub"
    draw.text((70, 210), subtitle, fill=CYAN, font=font_sub)

    # ── Description ────────────────────────────────────
    font_desc = find_font(20)
    desc = "Hacker-terminal portfolio of all BOSSincrypto GitHub projects."
    draw.text((70, 290), desc, fill=WHITE_DIM, font=font_desc)

    # ── Tags line ──────────────────────────────────────
    font_tags = find_font(18)
    tags = "Crypto  ·  AI  ·  Developer Tools  ·  Telegram Bots  ·  Mobile Apps"
    draw.text((70, 360), tags, fill=AMBER, font=font_tags)

    # ── Terminal prompt ────────────────────────────────
    font_prompt = find_font(22)
    prompt = "$ bossincrypto.dev"
    draw.text((70, 440), prompt, fill=GREEN, font=font_prompt)

    # ── Bottom bar ─────────────────────────────────────
    draw.line([(70, 520), (WIDTH - 70, 520)], fill=DIM, width=1)
    font_footer = find_font(16)
    footer = "github.com/BOSSincrypto  ·  x.com/BOSSincrypto  ·  t.me/BOSSincrypto"
    bbox = draw.textbbox((0, 0), footer, font=font_footer)
    tw = bbox[2] - bbox[0]
    draw.text(((WIDTH - tw) // 2, 540), footer, fill=DIM, font=font_footer)

    # ── Save ───────────────────────────────────────────
    out_path = os.path.join(os.path.dirname(__file__), "..", "public", "og-image.png")
    img.save(out_path, "PNG")
    print(f"og-image saved to {out_path} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    create_og_image()

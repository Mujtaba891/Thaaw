"""
Generate sophisticated high-resolution (2560x1440) desktop wallpapers for THAAW Browser.
Follows THAAW visual identity:
Palette: #050812, #070B14, #0A1020, #38BDF8, #FF6FF0, #C2410C
Zero text, calm center, dark overlay compatible.
"""

import math
import random
from PIL import Image, ImageDraw, ImageFilter

W, H = 2560, 1440

def save_wallpaper(im: Image.Image, name: str):
    full_path = f"assets/wallpapers/thaaw-{name}.webp"
    thumb_path = f"assets/wallpapers/thumbs/thaaw-{name}.webp"
    im.save(full_path, "WEBP", quality=94)
    thumb = im.copy()
    thumb.thumbnail((360, 202), Image.Resampling.LANCZOS)
    thumb.save(thumb_path, "WEBP", quality=85)
    print(f"Generated {full_path} & thumbnail")

# --- 04. CYAN MIST ---
def gen_cyan_mist():
    im = Image.new("RGB", (W, H), (5, 8, 18))
    draw = ImageDraw.Draw(im)
    # Background gradient
    for y in range(H):
        t = y / H
        r = int(5 + t * 4)
        g = int(8 + t * 16)
        b = int(18 + t * 35)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
    
    # Mountain layer 1 (distant mist)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    o_draw = ImageDraw.Draw(overlay)
    points1 = [(0, H)]
    for x in range(0, W + 40, 40):
        y = H * 0.45 + math.sin(x * 0.002) * 120 + math.cos(x * 0.005) * 60
        points1.append((x, y))
    points1.append((W, H))
    o_draw.polygon(points1, fill=(14, 35, 65, 140))
    overlay = overlay.filter(ImageFilter.GaussianBlur(15))
    im.paste(overlay, (0, 0), overlay)

    # Mountain layer 2 (midground)
    overlay2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    o_draw2 = ImageDraw.Draw(overlay2)
    points2 = [(0, H)]
    for x in range(0, W + 30, 30):
        y = H * 0.58 + math.sin(x * 0.003 + 1.2) * 140 + math.cos(x * 0.007) * 70
        points2.append((x, y))
    points2.append((W, H))
    o_draw2.polygon(points2, fill=(8, 22, 45, 200))
    overlay2 = overlay2.filter(ImageFilter.GaussianBlur(6))
    im.paste(overlay2, (0, 0), overlay2)

    # Mountain layer 3 (foreground dark silhouette)
    overlay3 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    o_draw3 = ImageDraw.Draw(overlay3)
    points3 = [(0, H)]
    for x in range(0, W + 20, 20):
        y = H * 0.72 + math.sin(x * 0.004 + 2.5) * 110 + math.cos(x * 0.009) * 50
        points3.append((x, y))
    points3.append((W, H))
    o_draw3.polygon(points3, fill=(5, 10, 22, 255))
    im.paste(overlay3, (0, 0), overlay3)

    # Soft cyan mist glow in valleys
    mist = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    m_draw = ImageDraw.Draw(mist)
    m_draw.ellipse([W * 0.15, H * 0.40, W * 0.85, H * 0.80], fill=(56, 189, 248, 28))
    m_draw.ellipse([W * 0.40, H * 0.50, W * 0.95, H * 0.75], fill=(255, 111, 240, 15))
    mist = mist.filter(ImageFilter.GaussianBlur(90))
    im.paste(mist, (0, 0), mist)

    save_wallpaper(im, "cyan-mist")

# --- 05. PINK NIGHT ---
def gen_pink_night():
    im = Image.new("RGB", (W, H), (4, 6, 14))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        r = int(4 + t * 12)
        g = int(6 + t * 6)
        b = int(14 + t * 24)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # Atmospheric pink clouds
    clouds = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(clouds)
    c_draw.ellipse([W * 0.05, H * 0.1, W * 0.65, H * 0.65], fill=(255, 111, 240, 25))
    c_draw.ellipse([W * 0.35, H * 0.25, W * 0.95, H * 0.75], fill=(225, 29, 72, 20))
    c_draw.ellipse([W * 0.55, H * 0.40, W * 0.85, H * 0.70], fill=(56, 189, 248, 18))
    clouds = clouds.filter(ImageFilter.GaussianBlur(120))
    im.paste(clouds, (0, 0), clouds)

    # Minimal dark landscape base
    land = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    l_draw = ImageDraw.Draw(land)
    pts = [(0, H)]
    for x in range(0, W + 30, 30):
        y = H * 0.82 + math.sin(x * 0.002) * 50
        pts.append((x, y))
    pts.append((W, H))
    l_draw.polygon(pts, fill=(5, 7, 16, 255))
    im.paste(land, (0, 0), land)

    save_wallpaper(im, "pink-night")

# --- 06. DARK OCEAN ---
def gen_dark_ocean():
    im = Image.new("RGB", (W, H), (3, 6, 15))
    draw = ImageDraw.Draw(im)
    # Sky
    horizon_y = int(H * 0.58)
    for y in range(horizon_y):
        t = y / horizon_y
        r = int(3 + t * 14)
        g = int(6 + t * 12)
        b = int(15 + t * 25)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
    
    # Distant warm horizon glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    g_draw.rectangle([(0, horizon_y - 25), (W, horizon_y + 15)], fill=(194, 65, 12, 45))
    g_draw.rectangle([(0, horizon_y - 10), (W, horizon_y + 5)], fill=(255, 111, 240, 20))
    glow = glow.filter(ImageFilter.GaussianBlur(25))
    im.paste(glow, (0, 0), glow)

    # Ocean water
    water = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    w_draw = ImageDraw.Draw(water)
    for y in range(horizon_y, H):
        t = (y - horizon_y) / (H - horizon_y)
        r = int(4 + (1 - t) * 6)
        g = int(8 + (1 - t) * 14)
        b = int(20 + (1 - t) * 25)
        w_draw.line([(0, y), (W, y)], fill=(r, g, b, 255))
    
    # Subtle reflections
    for y in range(horizon_y + 10, H, 12):
        t = (y - horizon_y) / (H - horizon_y)
        alpha = int((1 - t) * 35)
        w_draw.ellipse([W * 0.35, y, W * 0.65, y + 6], fill=(56, 189, 248, alpha))

    water = water.filter(ImageFilter.GaussianBlur(3))
    im.paste(water, (0, 0), water)

    save_wallpaper(im, "dark-ocean")

# --- 07. ABSTRACT FLOW ---
def gen_abstract_flow():
    im = Image.new("RGB", (W, H), (5, 8, 18))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        draw.line([(0, y), (W, y)], fill=(int(5 + t * 6), int(8 + t * 8), int(18 + t * 14)))

    flow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    f_draw = ImageDraw.Draw(flow)

    # Outer cyan flow ribbon
    for i in range(120):
        t = i / 120
        cx = W * (0.1 + t * 0.8)
        cy = H * (0.35 + math.sin(t * math.pi * 1.5) * 0.35)
        rad = 180 + math.sin(t * 3) * 60
        alpha = int(math.sin(t * math.pi) * 45)
        f_draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(56, 189, 248, alpha))

    # Inner pink accent ribbon
    for i in range(80):
        t = i / 80
        cx = W * (0.2 + t * 0.6)
        cy = H * (0.42 + math.cos(t * math.pi * 1.2) * 0.28)
        rad = 120 + math.sin(t * 2) * 40
        alpha = int(math.sin(t * math.pi) * 30)
        f_draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(255, 111, 240, alpha))

    # Small orange accent
    for i in range(50):
        t = i / 50
        cx = W * (0.65 + t * 0.25)
        cy = H * (0.65 + math.sin(t * 2) * 0.15)
        rad = 80
        alpha = int(math.sin(t * math.pi) * 25)
        f_draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(194, 65, 12, alpha))

    flow = flow.filter(ImageFilter.GaussianBlur(40))
    im.paste(flow, (0, 0), flow)

    save_wallpaper(im, "abstract-flow")

# --- 08. NIGHT FOREST ---
def gen_night_forest():
    im = Image.new("RGB", (W, H), (4, 7, 16))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        draw.line([(0, y), (W, y)], fill=(int(4 + t * 6), int(7 + t * 14), int(16 + t * 24)))

    # Distant mist
    mist = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    m_draw = ImageDraw.Draw(mist)
    m_draw.ellipse([W * 0.1, H * 0.45, W * 0.9, H * 0.85], fill=(56, 189, 248, 20))
    m_draw.ellipse([W * 0.4, H * 0.50, W * 0.8, H * 0.80], fill=(194, 65, 12, 18))
    mist = mist.filter(ImageFilter.GaussianBlur(70))
    im.paste(mist, (0, 0), mist)

    # Tree silhouettes (two layers)
    for layer, fill, y_base, blur in [
        (1, (8, 16, 32, 180), H * 0.62, 4),
        (2, (4, 8, 18, 255), H * 0.76, 1)
    ]:
        trees = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        t_draw = ImageDraw.Draw(trees)
        random.seed(layer * 42)
        x = 0
        while x < W:
            tree_w = random.randint(25, 60)
            tree_h = random.randint(180, 420) if layer == 1 else random.randint(240, 520)
            top_y = y_base - tree_h
            t_draw.polygon([
                (x + tree_w // 2, top_y),
                (x, y_base),
                (x + tree_w, y_base)
            ], fill=fill)
            # Trunk
            t_draw.rectangle([
                (x + tree_w // 2 - 4, y_base),
                (x + tree_w // 2 + 4, H)
            ], fill=fill)
            x += tree_w - random.randint(5, 15)
        if blur > 1:
            trees = trees.filter(ImageFilter.GaussianBlur(blur))
        im.paste(trees, (0, 0), trees)

    save_wallpaper(im, "night-forest")

# --- 09. MODERN ARCHITECTURE ---
def gen_modern_architecture():
    im = Image.new("RGB", (W, H), (5, 7, 15))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        draw.line([(0, y), (W, y)], fill=(int(5 + t * 4), int(7 + t * 10), int(15 + t * 20)))

    arch = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    a_draw = ImageDraw.Draw(arch)

    # Left building structure
    a_draw.polygon([
        (0, H),
        (0, H * 0.25),
        (W * 0.28, H * 0.40),
        (W * 0.32, H)
    ], fill=(9, 14, 28, 255))

    # Right building structure
    a_draw.polygon([
        (W, H),
        (W, H * 0.18),
        (W * 0.72, H * 0.35),
        (W * 0.68, H)
    ], fill=(12, 18, 35, 255))

    # Architecture edge lights (cyan)
    a_draw.line([(0, H * 0.25), (W * 0.28, H * 0.40)], fill=(56, 189, 248, 120), width=3)
    a_draw.line([(W, H * 0.18), (W * 0.72, H * 0.35)], fill=(56, 189, 248, 120), width=3)

    # Interior warm accent window line
    a_draw.line([(W * 0.72, H * 0.48), (W * 0.95, H * 0.35)], fill=(194, 65, 12, 160), width=2)
    a_draw.line([(W * 0.05, H * 0.38), (W * 0.24, H * 0.48)], fill=(255, 111, 240, 120), width=2)

    im.paste(arch, (0, 0), arch)
    save_wallpaper(im, "modern-architecture")

# --- 10. DEEP SPACE ---
def gen_deep_space():
    im = Image.new("RGB", (W, H), (2, 4, 10))
    nebula = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    n_draw = ImageDraw.Draw(nebula)

    # Soft cyan & purple nebula
    n_draw.ellipse([W * 0.08, H * 0.15, W * 0.55, H * 0.75], fill=(56, 189, 248, 22))
    n_draw.ellipse([W * 0.45, H * 0.20, W * 0.92, H * 0.85], fill=(168, 85, 247, 18))
    n_draw.ellipse([W * 0.35, H * 0.45, W * 0.75, H * 0.80], fill=(255, 111, 240, 14))
    nebula = nebula.filter(ImageFilter.GaussianBlur(130))
    im.paste(nebula, (0, 0), nebula)

    # Minimal tiny stars (none right in center logo area)
    stars = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(stars)
    random.seed(1337)
    for _ in range(120):
        sx = random.randint(0, W)
        sy = random.randint(0, H)
        # Avoid center
        if W * 0.35 < sx < W * 0.65 and H * 0.25 < sy < H * 0.65:
            continue
        brightness = random.randint(100, 240)
        s_draw.ellipse([sx, sy, sx + 2, sy + 2], fill=(240, 248, 255, brightness))
    im.paste(stars, (0, 0), stars)

    save_wallpaper(im, "deep-space")

# --- 11. MIST VALLEY ---
def gen_mist_valley():
    im = Image.new("RGB", (W, H), (5, 8, 18))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        draw.line([(0, y), (W, y)], fill=(int(5 + t * 8), int(8 + t * 14), int(18 + t * 24)))

    valley = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    v_draw = ImageDraw.Draw(valley)

    # Distant mountain ridge
    pts_d = [(0, H)]
    for x in range(0, W + 40, 40):
        y = H * 0.42 + math.sin(x * 0.002) * 100
        pts_d.append((x, y))
    pts_d.append((W, H))
    v_draw.polygon(pts_d, fill=(16, 28, 52, 180))

    # Horizon warmth
    v_draw.ellipse([W * 0.3, H * 0.38, W * 0.7, H * 0.60], fill=(194, 65, 12, 35))
    v_draw.ellipse([W * 0.2, H * 0.40, W * 0.8, H * 0.68], fill=(56, 189, 248, 30))

    # Near slopes (flanking left and right, leaving center low)
    pts_l = [(0, H), (0, H * 0.50), (W * 0.40, H * 0.78), (W * 0.45, H)]
    v_draw.polygon(pts_l, fill=(8, 14, 26, 255))

    pts_r = [(W, H), (W, H * 0.48), (W * 0.60, H * 0.76), (W * 0.55, H)]
    v_draw.polygon(pts_r, fill=(10, 16, 30, 255))

    valley = valley.filter(ImageFilter.GaussianBlur(8))
    im.paste(valley, (0, 0), valley)
    save_wallpaper(im, "mist-valley")

# --- 12. ABSTRACT GEOMETRY ---
def gen_abstract_geometry():
    im = Image.new("RGB", (W, H), (6, 9, 19))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        draw.line([(0, y), (W, y)], fill=(int(6 + t * 6), int(9 + t * 8), int(19 + t * 15)))

    geom = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(geom)

    # Large subtle isometric planes
    g_draw.polygon([
        (W * 0.05, H * 0.30),
        (W * 0.35, H * 0.15),
        (W * 0.40, H * 0.70),
        (W * 0.10, H * 0.85)
    ], fill=(15, 24, 48, 120))

    g_draw.polygon([
        (W * 0.65, H * 0.25),
        (W * 0.95, H * 0.38),
        (W * 0.90, H * 0.88),
        (W * 0.60, H * 0.75)
    ], fill=(20, 32, 60, 110))

    # Glowing edge accents
    g_draw.line([(W * 0.05, H * 0.30), (W * 0.35, H * 0.15)], fill=(56, 189, 248, 90), width=2)
    g_draw.line([(W * 0.65, H * 0.25), (W * 0.95, H * 0.38)], fill=(255, 111, 240, 80), width=2)
    g_draw.line([(W * 0.60, H * 0.75), (W * 0.90, H * 0.88)], fill=(194, 65, 12, 70), width=2)

    geom = geom.filter(ImageFilter.GaussianBlur(15))
    im.paste(geom, (0, 0), geom)
    save_wallpaper(im, "abstract-geometry")

# --- 13. NIGHT CITY ---
def gen_night_city():
    im = Image.new("RGB", (W, H), (4, 6, 14))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        draw.line([(0, y), (W, y)], fill=(int(4 + t * 6), int(6 + t * 8), int(14 + t * 18)))

    # Distant skyline silhouette
    skyline = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(skyline)
    random.seed(999)
    x = 0
    y_base = H * 0.75
    while x < W:
        bw = random.randint(30, 80)
        bh = random.randint(80, 280)
        s_draw.rectangle([(x, y_base - bh), (x + bw, y_base + 10)], fill=(8, 12, 24, 255))
        # Subtle window dots
        for wy in range(int(y_base - bh + 15), int(y_base), 16):
            if random.random() > 0.65:
                color = (56, 189, 248, 180) if random.random() > 0.3 else (194, 65, 12, 160)
                s_draw.rectangle([(x + 6, wy), (x + 10, wy + 4)], fill=color)
        x += bw + random.randint(4, 15)

    # Base water/ground
    s_draw.rectangle([(0, y_base), (W, H)], fill=(4, 7, 16, 255))
    im.paste(skyline, (0, 0), skyline)
    save_wallpaper(im, "night-city")

# --- 14. POLAR MIST ---
def gen_polar_mist():
    im = Image.new("RGB", (W, H), (6, 11, 24))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        draw.line([(0, y), (W, y)], fill=(int(6 + t * 14), int(11 + t * 24), int(24 + t * 38)))

    ice = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    i_draw = ImageDraw.Draw(ice)

    # Soft glacial flow
    i_draw.ellipse([W * 0.15, H * 0.48, W * 0.85, H * 0.82], fill=(56, 189, 248, 30))
    i_draw.ellipse([W * 0.35, H * 0.52, W * 0.75, H * 0.78], fill=(240, 249, 255, 20))
    i_draw.ellipse([W * 0.55, H * 0.38, W * 0.95, H * 0.68], fill=(255, 111, 240, 15))

    # Ice ridges
    pts = [(0, H), (0, H * 0.75), (W * 0.35, H * 0.70), (W * 0.70, H * 0.76), (W, H * 0.72), (W, H)]
    i_draw.polygon(pts, fill=(10, 18, 38, 255))
    i_draw.line([(0, H * 0.75), (W * 0.35, H * 0.70), (W * 0.70, H * 0.76), (W, H * 0.72)], fill=(56, 189, 248, 140), width=2)

    ice = ice.filter(ImageFilter.GaussianBlur(10))
    im.paste(ice, (0, 0), ice)
    save_wallpaper(im, "polar-mist")

# --- 15. THAAW SIGNATURE ---
def gen_thaaw_signature():
    im = Image.new("RGB", (W, H), (5, 8, 18))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        draw.line([(0, y), (W, y)], fill=(int(5 + t * 6), int(8 + t * 12), int(18 + t * 22)))

    sig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(sig)

    # Boundary protection rings (concentric, interrupted arcs on left and right)
    cx, cy = W * 0.5, H * 0.5
    # Outer defensive boundary arc (Cyan)
    for r in [520, 560]:
        s_draw.arc([cx - r, cy - r, cx + r, cy + r], start=120, end=240, fill=(56, 189, 248, 45), width=12)
        s_draw.arc([cx - r, cy - r, cx + r, cy + r], start=-40, end=60, fill=(56, 189, 248, 45), width=12)

    # Secondary protective arc (Pink)
    for r in [420, 450]:
        s_draw.arc([cx - r, cy - r, cx + r, cy + r], start=150, end=210, fill=(255, 111, 240, 40), width=8)
        s_draw.arc([cx - r, cy - r, cx + r, cy + r], start=-20, end=40, fill=(255, 111, 240, 40), width=8)

    # Stop / Barrier accents (Orange)
    s_draw.line([(cx - 620, cy - 80), (cx - 620, cy + 80)], fill=(194, 65, 12, 90), width=6)
    s_draw.line([(cx + 620, cy - 80), (cx + 620, cy + 80)], fill=(194, 65, 12, 90), width=6)

    sig = sig.filter(ImageFilter.GaussianBlur(18))
    im.paste(sig, (0, 0), sig)
    save_wallpaper(im, "signature")

if __name__ == "__main__":
    print("Generating remaining 12 THAAW wallpapers...")
    gen_cyan_mist()
    gen_pink_night()
    gen_dark_ocean()
    gen_abstract_flow()
    gen_night_forest()
    gen_modern_architecture()
    gen_deep_space()
    gen_mist_valley()
    gen_abstract_geometry()
    gen_night_city()
    gen_polar_mist()
    gen_thaaw_signature()
    print("All 15 wallpapers successfully generated and registered!")

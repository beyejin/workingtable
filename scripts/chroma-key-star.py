# Magenta chroma-key for the star icon source.
# Input:  asset/_star-src.png  (sky-blue star on solid magenta)
# Output: asset/todoary-icon.png  (transparent background)
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "asset", "_star-src.png")
DST = os.path.join(ROOT, "asset", "todoary-icon.png")

im = Image.open(SRC).convert("RGBA")
w, h = im.size
print(f"loaded {SRC}  size={w}x{h}  mode={im.mode}")

# Resize down to 1024x1024 if larger (icons standard size)
if max(w, h) != 1024:
    im = im.resize((1024, 1024), Image.LANCZOS)
    w, h = im.size
    print(f"resized to {w}x{h}")

px = im.load()

# Magenta key parameters.
# Pure magenta is (255, 0, 255). Distance metric: how "magenta-ish" each pixel is.
# A pixel is fully magenta when R≈255, G≈0, B≈255. Use the G channel + R/B saturation
# to derive alpha. Soft edges keep anti-aliasing.
KEY_R, KEY_G, KEY_B = 255, 0, 255
T_KEY = 90    # below this distance from magenta → fully transparent
T_KEEP = 180  # above this distance from magenta → fully opaque

def dist_from_key(r, g, b):
    dr = r - KEY_R
    dg = g - KEY_G
    db = b - KEY_B
    return (dr * dr + dg * dg + db * db) ** 0.5

# Despill: reduce magenta tint at edges by clamping R and B so they don't both
# exceed G by a wide margin. Simple rule: cap R and B at max(G, max-channel).
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        d = dist_from_key(r, g, b)
        if d <= T_KEY:
            px[x, y] = (0, 0, 0, 0)
            continue
        if d >= T_KEEP:
            new_a = 255
        else:
            t = (d - T_KEY) / (T_KEEP - T_KEY)
            new_a = int(round(255 * t))
        # Despill: edge pixels (partial alpha) often have a pink halo.
        # Cap R and B to G's level when both exceed G — that's the magenta signature.
        if r > g and b > g and new_a < 255:
            cap = g + (max(r, b) - g) // 4  # gently pull back
            r = min(r, cap)
            b = min(b, cap)
        px[x, y] = (r, g, b, new_a)

im.save(DST, format="PNG")
print(f"saved {DST}")

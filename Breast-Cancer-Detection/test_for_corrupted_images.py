# find_and_fix_bad_pngs.py
import os
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = False  # be strict

ROOT = "dataset/train"
bad = []

for sub in ("benign", "malignant"):
    d = os.path.join(ROOT, sub)
    for fn in os.listdir(d):
        if not fn.lower().endswith((".png", ".jpg", ".jpeg")):
            continue
        p = os.path.join(d, fn)
        try:
            with Image.open(p) as im:
                im.verify()   # quick integrity check
            # optional: reopen to fully load pixels
            with Image.open(p) as im:
                im.load()
        except Exception as e:
            bad.append(p)

print(f"Found {len(bad)} corrupted images.")
for p in bad:
    try:
        os.remove(p)
        print("Removed:", p)
    except Exception:
        pass

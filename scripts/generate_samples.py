"""
Generate the curated demo fixtures used by the live demo.

Requirements: Python 3 with Pillow (``pip install pillow``).
The generated files are committed in public/samples so judges do not need
to run this script. Run it only if you want to regenerate them.

    python scripts/generate_samples.py

"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "samples"
OUT.mkdir(parents=True, exist_ok=True)
FONT_DIR = Path(__import__("os").environ.get("TEMP", ".")) / "studymate-fonts"
FONT_DIR.mkdir(parents=True, exist_ok=True)


def download_font(name: str, url: str) -> Path:
    target = FONT_DIR / name
    if not target.exists():
        import urllib.request

        urllib.request.urlretrieve(url, target)
    return target


HAND_URL = "https://github.com/google/fonts/raw/main/ofl/caveat/Caveat%5Bwght%5D.ttf"
PRINT_URL = "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito%5Bwght%5D.ttf"
hand_path = download_font("Caveat.ttf", HAND_URL)
print_path = download_font("Nunito.ttf", PRINT_URL)

W, H = 1600, 2080
paper = Image.new("RGB", (W, H), "#f6f1e5")

# Paper grain and ruled lines.
px = paper.load()
random.seed(7)
for y in range(H):
    for x in range(0, W, 2):
        n = random.randint(-6, 6)
        r, g, b = px[x, y]
        px[x, y] = (max(0, r + n), max(0, g + n), max(0, b + n - 2))

draw = ImageDraw.Draw(paper)
for y in range(250, H - 80, 72):
    draw.line((0, y, W, y), fill=(199, 207, 216), width=2)
draw.line((150, 0, 150, H), fill=(224, 161, 156), width=3)

# A page heading and "student" annotations.
font_big = ImageFont.truetype(str(hand_path), 92)
font = ImageFont.truetype(str(hand_path), 57)
font_small = ImageFont.truetype(str(hand_path), 43)
font_math = ImageFont.truetype(str(hand_path), 61)

ink = (29, 38, 58)
blue = (34, 60, 122)
red = (152, 42, 43)

draw.text((260, 180), "PHYSICS — KINEMATICS", font=font_big, fill=ink)
draw.text((330, 300), "Motion in a straight line  (Ch. 3)", font=font, fill=blue)

body = [
    (290, 430, "• Motion = change of position with time.", font, ink),
    (290, 520, "• Rest & motion are relative; frame of reference matters.", font_small, ink),
    (290, 615, "• Distance: total path length (scalar).", font, ink),
    (290, 705, "• Displacement: shortest vector from start to end.", font, ink),
    (290, 805, "Speed = distance / time", font_math, blue),
    (290, 895, "Velocity = displacement / time  (vector)", font_math, blue),
    (290, 1000, "Uniform motion: equal displacement in equal time.", font_small, ink),
    (290, 1090, "Acceleration a = dv / dt", font_math, red),
    (290, 1195, "Equations of motion (constant a):", font, ink),
    (360, 1285, "1)  v = u + a·t", font_math, ink),
    (360, 1375, "2)  s = u·t + ½ a t²", font_math, ink),
    (360, 1465, "3)  v² = u² + 2 a s", font_math, ink),
    (290, 1580, "Graph: slope of x–t = velocity", font, blue),
    (290, 1665, "Area under v–t graph = displacement", font_small, blue),
    (290, 1760, "?? smudged: ½ a t^2  or  ½ a t^3 ?", font_small, red),
    (290, 1855, "Sign convention: up (+) / down (−)", font_small, ink),
    (290, 1932, "Revise: relative velocity + river-boat problems", font_small, ink),
]
for x, y, text, f, col in body:
    draw.text((x, y), text, font=f, fill=col)

# Hand-drawn diagram: v-t graph.
gx, gy = 1090, 1320
draw.line((gx, gy, gx, gy + 280), fill=ink, width=4)
draw.line((gx, gy + 280, gx + 360, gy + 280), fill=ink, width=4)
draw.line((gx + 20, gy + 250, gx + 310, gy + 40), fill=blue, width=5)
draw.text((gx + 330, gy + 280), "t", font=font_small, fill=ink)
draw.text((gx - 55, gy - 40), "v", font=font_small, fill=ink)
draw.text((gx + 70, gy + 315), "slope = a", font=font_small, fill=red)

# Slight rotation, uneven lighting, blur and sensor noise — like a phone photo.
paper = paper.rotate(-2.2, expand=True, resample=Image.Resampling.BICUBIC, fillcolor="#e9e2d3")
paper = paper.resize((1180, int(paper.height * 1180 / paper.width)), Image.Resampling.LANCZOS)

# Uneven phone-camera lighting: a bright window side and a soft corner shadow.
light = Image.linear_gradient("L").resize(paper.size)
light = light.point(lambda p: 232 + int(p * 0.08))
ld = ImageDraw.Draw(light)
ld.ellipse((-560, paper.height - 240, 520, paper.height + 700), fill=218)
ld.ellipse((paper.width - 430, -650, paper.width + 500, 520), fill=208)
ld.ellipse((-700, -500, 600, 300), fill=245)
light = light.filter(ImageFilter.GaussianBlur(190))
shadow = Image.new("RGB", paper.size, (36, 33, 46))
paper = Image.composite(paper, shadow, light)
paper = paper.filter(ImageFilter.GaussianBlur(0.7))

# Noise and warm cast.
px = paper.load()
random.seed(11)
for _ in range(90000):
    x = random.randrange(paper.width)
    y = random.randrange(paper.height)
    r, g, b = px[x, y]
    n = random.randint(-13, 13)
    px[x, y] = (max(0, min(255, r + n)), max(0, min(255, g + n)), max(0, min(255, b + n)))
paper = paper.filter(ImageFilter.UnsharpMask(radius=1.4, percent=115, threshold=3))

paper.save(OUT / "handwritten-notes.png", optimize=True)
print("wrote", OUT / "handwritten-notes.png")

# A deliberately ambiguous handwritten fixture for the reliability lab.
amb = Image.new("RGB", (1500, 1200), "#efe9dc")
d = ImageDraw.Draw(amb)
for y in range(210, 1100, 82):
    d.line((0, y, 1500, y), fill=(202, 207, 213), width=2)
d.text((130, 140), "Calc — integration practice", font=ImageFont.truetype(str(hand_path), 84), fill=ink)
d.text((180, 330), "Q6.  Evaluate the integral", font=ImageFont.truetype(str(hand_path), 60), fill=ink)
d.text((280, 470), "∫  x²  dx   =  x³/3  + C", font=ImageFont.truetype(str(hand_path), 84), fill=ink)
d.text((280, 650), "Q7.  Evaluate  ∫  x?  dx", font=ImageFont.truetype(str(hand_path), 84), fill=red)
d.text((300, 790), "     the exponent is smudged / overwritten", font=ImageFont.truetype(str(hand_path), 46), fill=red)
d.text((180, 960), "— answer depends on the exponent; do not guess.", font=ImageFont.truetype(str(hand_path), 48), fill=blue)
amb = amb.rotate(-1.4, expand=True, resample=Image.Resampling.BICUBIC, fillcolor="#e6dfd1")
amb = amb.filter(ImageFilter.GaussianBlur(0.9))
amb.save(OUT / "ambiguous-handwriting.png", optimize=True)
print("wrote", OUT / "ambiguous-handwriting.png")

# Notebook / lecture cover used in the landing mock.
cover = Image.new("RGB", (900, 1200), "#111735")
c = ImageDraw.Draw(cover)
for y in range(0, 1200, 4):
    c.line((0, y, 900, y), fill=(17 + y // 100, 23 + y // 120, 53 + y // 60), width=1)
c.text((75, 90), "STUDYMATE", font=ImageFont.truetype(str(print_path), 62), fill="#EDEAFF")
c.text((75, 185), "LECTURE NOTES", font=ImageFont.truetype(str(print_path), 34), fill="#B8A4FF")
for i in range(1, 9):
    c.text((90, 320 + i * 80), "—" * random.randint(4, 12), font=ImageFont.truetype(str(print_path), 30), fill="#5B6188")
cover.save(OUT / "notes-cover.png", optimize=True)
print("wrote", OUT / "notes-cover.png")

"""Convert the official Bricolage font into portable wordmark outlines.

Usage: python docs/brand/vetorizar_wordmark.py path/to/bricolage.ttf
Requires fonttools; the resulting JSON is consumed by generate-brand.mjs.
"""
import json
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

source = TTFont(sys.argv[1])
fonts = {
    weight: instantiateVariableFont(source, {"wght": weight, "opsz": 48}, inplace=False)
    for weight in (500, 700)
}
x = 80.0
paths = []
dot = ""
for index, character in enumerate("HonorMed."):
    font = fonts[700 if index < 5 else 500]
    glyphs = font.getGlyphSet()
    glyph = font.getBestCmap()[ord(character)]
    scale = 42 / font["head"].unitsPerEm
    pen = SVGPathPen(glyphs, ntos=lambda n: f"{n:.3f}".rstrip("0").rstrip("."))
    glyphs[glyph].draw(TransformPen(pen, (scale, 0, 0, -scale, x, 45)))
    if character == ".":
        dot = pen.getCommands()
    else:
        paths.append(pen.getCommands())
    x += font["hmtx"][glyph][0] * scale - 1.4
target = Path(__file__).with_name("wordmark-paths.json")
target.write_text(json.dumps({"path": "".join(paths), "dot": dot, "width": round(x + 5)}, separators=(",", ":")), encoding="utf-8")
print("Wordmark vetorizado; fonte sob SIL OFL 1.1.")

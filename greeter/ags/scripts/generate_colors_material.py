#!/usr/bin/env python3
import argparse
import math
import json
from PIL import Image
from materialyoucolor.quantize import QuantizeCelebi
from materialyoucolor.score.score import Score
from materialyoucolor.hct import Hct
from materialyoucolor.dynamiccolor.material_dynamic_colors import MaterialDynamicColors
from materialyoucolor.utils.color_utils import (rgba_from_argb, argb_from_rgb, argb_from_rgba)
from materialyoucolor.utils.math_utils import (sanitize_degrees_double, difference_degrees, rotation_direction)
from materialyoucolor.scheme.scheme_rainbow import SchemeRainbow as Scheme

parser = argparse.ArgumentParser(description='Colour generation script')
parser.add_argument('--path', type=str, default=None, help='generate colourscheme from image')
args = parser.parse_args()

rgba_to_hex = lambda rgba: "#{:02X}{:02X}{:02X}".format(rgba[0], rgba[1], rgba[2])

def calculate_optimal_size (width: int, height: int, bitmap_size: int) -> (int, int):
    image_area = width * height;
    bitmap_area = bitmap_size ** 2
    scale = math.sqrt(bitmap_area/image_area) if image_area > bitmap_area else 1
    new_width = round(width * scale)
    new_height = round(height * scale)
    if new_width == 0:
        new_width = 1
    if new_height == 0:
        new_height = 1
    return new_width, new_height

darkmode = True

if args.path is not None:
    image = Image.open(args.path)

    if image.format == "GIF":
        image.seek(1)

    wsize, hsize = image.size
    wsize_new, hsize_new = calculate_optimal_size(wsize, hsize, 128)
    if wsize_new < wsize or hsize_new < hsize:
        image = image.resize((wsize_new, hsize_new), Image.Resampling.BICUBIC)
    colors = QuantizeCelebi(list(image.getdata()), 128)
    argb = Score.score(colors)[0]
    hct = Hct.from_int(argb)
    if(hct.tone > 60):
        darkmode = False

# Generate
scheme = Scheme(hct, True, 0.0)

material_colors = {}

for color in vars(MaterialDynamicColors).keys():
    color_name = getattr(MaterialDynamicColors, color)
    if hasattr(color_name, "get_hct"):
        rgba = color_name.get_hct(scheme).to_rgba()
        material_colors[color] = rgba_to_hex(rgba)

print(f"$darkmode: {darkmode};")
for color, code in material_colors.items():
    print(f"${color}: {code};")

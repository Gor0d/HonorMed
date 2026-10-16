"""Generate an editable physician-facing deck. Run with PYTHONPATH=.tools/presentation."""
from pathlib import Path
from decimal import Decimal
import re
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BRAND = re.search(r'PRODUCT_NAME\s*=\s*"([^"]+)"', (ROOT/'web/src/lib/brand.ts').read_text(encoding='utf-8')).group(1)
_plans=(ROOT/'web/src/lib/plans.ts').read_text(encoding='utf-8')
PRO_PRICE=Decimal(re.search(r'\bpro:\s*([\d.]+)',_plans).group(1))
INSTITUTIONAL_PRICE=Decimal(re.search(r'\binstitutional:\s*([\d.]+)',_plans).group(1))
def brl(value): return 'R$ '+f'{value:,.2f}'.replace(',','_').replace('.',',').replace('_','.')
OUT = ROOT / 'docs' / 'apresentacao'
OUT.mkdir(parents=True, exist_ok=True)
prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BG, WHITE, INK, MUTED, GREEN, SOFT, LINE, GOLD = 'EFF4F2', 'FFFFFF', '0E1F1B', '4A5F59', '0B7A66', 'D3EBE4', 'D5E0DC', 'B16A0B'
DEEP = '095E4F'  # darker green for contrast on filled surfaces
# Segoe UI ships with Windows/Office, so the deck looks the same in PowerPoint and in the exported PDF.
BODY, DISPLAY = 'Segoe UI', 'Segoe UI Semibold'
LEFT = .55  # one left edge for every element on the slide
TOTAL = 18

def box(s,x,y,w,h,color=WHITE,radius=True,line=None,round_=.12):
    sh=s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    if radius: sh.adjustments[0]=round_
    sh.fill.solid(); sh.fill.fore_color.rgb=RGBColor.from_string(color)
    if line: sh.line.color.rgb=RGBColor.from_string(line); sh.line.width=Pt(1)
    else: sh.line.fill.background()
    sh.shadow.inherit=False  # flat surfaces; the default theme shadow looked muddy on the cards
    return sh

def text(s,content,x,y,w,h,size=20,color=INK,bold=False,font=BODY,spacing=1.1,after=6,align=None):
    sh=s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf=sh.text_frame;tf.word_wrap=True
    tf.margin_left=tf.margin_right=Inches(.01); tf.margin_top=tf.margin_bottom=0
    for i,line in enumerate(content.split('\n')):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph()
        p.text=line;p.font.name=font;p.font.size=Pt(size);p.font.bold=bold;p.font.color.rgb=RGBColor.from_string(color)
        p.line_spacing=spacing;p.space_after=Pt(after)
        if align:p.alignment=align
    return sh

def base(kicker,title,sub=None,dark=False):
    s=prs.slides.add_slide(prs.slide_layouts[6]);s.background.fill.solid();s.background.fill.fore_color.rgb=RGBColor.from_string(INK if dark else BG)
    text(s,kicker.upper(),LEFT,.4,11,.3,10.5,SOFT if dark else GREEN,True,after=0)
    text(s,title,LEFT,.82,12.2,1.1,32,WHITE if dark else INK,False,DISPLAY,spacing=1.0,after=0)
    if sub:text(s,sub,LEFT,1.75,12.1,.5,16,SOFT if dark else MUTED,after=0)
    text(s,f'{BRAND}  ·  Controle pessoal  ·  dados fictícios  ·  Out/2026',LEFT,7.08,10,.2,9,SOFT if dark else MUTED,after=0)
    text(s,f'{len(prs.slides):02} / {TOTAL}',11.4,7.06,1.4,.25,10,SOFT if dark else MUTED,True,after=0,align=3)  # 3 = right
    return s

def card(s,x,y,w,title,body,tag=None,dark=False,h=3.1):
    box(s,x,y,w,h,GREEN if dark else WHITE,line=None if dark else LINE)
    if tag:text(s,tag,x+.28,y+.26,w-.56,.3,11,SOFT if dark else GREEN,True,after=0)
    text(s,title,x+.28,y+.7,w-.56,.8,22,WHITE if dark else INK,False,DISPLAY,spacing=1.0,after=0)
    text(s,body,x+.28,y+1.75,w-.56,h-1.9,16,WHITE if dark else MUTED,after=0)

def pill(s,x,y,w,h,label,fill=GREEN,color=WHITE,size=14):
    box(s,x,y,w,h,fill,round_=.5)
    text(s,label,x,y+(h-size/72*1.3)/2,w,h,size,color,True,after=0,align=2)  # 2 = center

def notes(s,body):s.notes_slide.notes_text_frame.text=body

def screenshot(s,path,x,y,w,h):
    iw,ih=Image.open(path).size
    p=s.shapes.add_picture(str(path), Inches(x), Inches(y), width=Inches(w), height=Inches(h))
    source_ratio=iw/ih; frame_ratio=w/h
    if source_ratio<frame_ratio:p.crop_bottom=1-source_ratio/frame_ratio  # keep the top of tall page captures
    else:
        crop=(1-frame_ratio/source_ratio)/2;p.crop_left=crop;p.crop_right=crop
    return p

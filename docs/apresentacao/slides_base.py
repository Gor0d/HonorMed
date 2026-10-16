"""Generate an editable physician-facing deck. Run with PYTHONPATH=.tools/presentation."""
from pathlib import Path
import re
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BRAND = re.search(r'PRODUCT_NAME\s*=\s*"([^"]+)"', (ROOT/'web/src/lib/brand.ts').read_text(encoding='utf-8')).group(1)
OUT = ROOT / 'docs' / 'apresentacao'
OUT.mkdir(parents=True, exist_ok=True)
prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BG, WHITE, INK, MUTED, GREEN, SOFT, LINE, GOLD = 'EFF4F2', 'FFFFFF', '0E1F1B', '52655F', '0B7A66', 'D3EBE4', 'D5E0DC', 'B16A0B'

def box(s,x,y,w,h,color=WHITE,radius=True,line=None):
    sh=s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    if radius: sh.adjustments[0]=.12
    sh.fill.solid(); sh.fill.fore_color.rgb=RGBColor.from_string(color)
    sh.line.fill.background() if line is None else None
    if line: sh.line.color.rgb=RGBColor.from_string(line)
    return sh

def text(s,content,x,y,w,h,size=20,color=INK,bold=False,font='Manrope'):
    sh=s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf=sh.text_frame;tf.word_wrap=True
    tf.margin_left=tf.margin_right=Inches(.01); tf.margin_top=tf.margin_bottom=0
    for i,line in enumerate(content.split('\n')):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph()
        p.text=line;p.font.name=font;p.font.size=Pt(size);p.font.bold=bold;p.font.color.rgb=RGBColor.from_string(color)
        p.space_after=Pt(9)
    return sh

def base(kicker,title,sub=None,dark=False):
    s=prs.slides.add_slide(prs.slide_layouts[6]);s.background.fill.solid();s.background.fill.fore_color.rgb=RGBColor.from_string(INK if dark else BG)
    text(s,kicker.upper(),.55,.34,11,.3,10,SOFT if dark else GREEN,True)
    text(s,title,.55,.85,12.1,1.0,32,WHITE if dark else INK,True,'Bricolage Grotesque')
    if sub:text(s,sub,.55,1.85,12.1,.7,15,SOFT if dark else MUTED)
    text(s,f'{BRAND}  /  Controle pessoal · dados fictícios · Out/2026',.55,7.12,10,.2,9,SOFT if dark else MUTED)
    text(s,f'{len(prs.slides):02}',12.2,7.1,.55,.25,10,SOFT if dark else MUTED,True)
    return s

def card(s,x,y,w,title,body,tag=None):
    box(s,x,y,w,3.0,line=LINE)
    if tag:text(s,tag,x+.22,y+.2,w-.44,.35,11,GREEN,True)
    text(s,title,x+.22,y+.7,w-.44,.7,23,INK,True,'Bricolage Grotesque')
    text(s,body,x+.22,y+1.5,w-.44,1.3,16,MUTED)

def notes(s,body):s.notes_slide.notes_text_frame.text=body

def screenshot(s,path,x,y,w,h):
    iw,ih=Image.open(path).size
    p=s.shapes.add_picture(str(path), Inches(x), Inches(y), width=Inches(w), height=Inches(h))
    source_ratio=iw/ih; frame_ratio=w/h
    if source_ratio<frame_ratio:p.crop_bottom=1-source_ratio/frame_ratio
    else:
        crop=(1-frame_ratio/source_ratio)/2;p.crop_left=crop;p.crop_right=crop
    return p


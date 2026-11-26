"""Confronto automatico codice ↔ Figma (fase 6, passo 4).

Per ogni schermata: porta l'app nello stesso stato della tavola Figma, fa lo screenshot a 402×874,
lo mette accanto a quello di Figma (tests/figma/<nome>.png) con una mappa delle differenze,
e scrive in tests/out/report.md la percentuale di pixel diversi (esclusa la mappa, che in Figma è disegnata).

Uso: npm run build && npx vite preview --port 4173 &  poi  python3 tests/compare.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).parent
OUT = ROOT / 'out'
OUT.mkdir(exist_ok=True)
URL = 'http://localhost:4173'
FLAT = '.device{border-radius:0!important;box-shadow:none!important} .stage{padding:0!important} *{caret-color:transparent}'

def go_home(pg): pg.goto(f'{URL}/'); pg.evaluate('localStorage.clear()'); pg.goto(f'{URL}/?theme=light')
def go_scopri(pg): pg.goto(f'{URL}/scopri?theme=light')
def go_scheda(pg):
    pg.goto(f'{URL}/scopri/padel-ostiense?sport=padel&theme=light'); pg.wait_for_timeout(900)
    pg.evaluate("document.querySelector('.venue-sheet__body').scrollTop=400")
    pg.wait_for_timeout(200)
    pg.get_by_role('button', name='19:30', exact=True).evaluate('el => el.click()')
    pg.evaluate("document.querySelector('.venue-sheet__body').scrollTop=0")
def go_riepilogo(pg):
    pg.goto(f'{URL}/scopri/yoga-flow?theme=light'); pg.wait_for_timeout(900)
    pg.evaluate("document.querySelector('.venue-sheet__body').scrollTop=400"); pg.wait_for_timeout(200)
    pg.get_by_role('button', name='18:30', exact=True).evaluate('el => el.click()')
    pg.locator('.bottom-bar .button--primary').click(); pg.wait_for_timeout(900)
def go_conferma(pg):
    go_riepilogo(pg)
    pg.locator('.apple-pay').click(); pg.wait_for_timeout(1600)

def reset(pg):
    pg.goto(f'{URL}/'); pg.evaluate("localStorage.clear()")
def go_premi(pg): reset(pg); pg.goto(f'{URL}/premi?theme=light')
def go_premi_scuro(pg): reset(pg); pg.goto(f'{URL}/premi?theme=dark')
def go_arrivarci(pg): go_premi(pg); pg.wait_for_timeout(500); pg.locator('.voucher-row').nth(1).click(); pg.wait_for_timeout(900)
def go_sheet_buono(pg): go_premi(pg); pg.wait_for_timeout(500); pg.locator('.use-button').click(); pg.wait_for_timeout(900)
def go_scopri_buono(pg): go_sheet_buono(pg); pg.get_by_role('button', name="Trova un'attività").click(); pg.wait_for_timeout(1500)
def go_dettaglio(pg): reset(pg); pg.goto(f'{URL}/premi/traguardi?t=serie-30&theme=light'); pg.wait_for_timeout(900)

# (nome, come arrivarci, zone da escludere [x0,y0,x1,y1] in pt)
SCREENS = [
    ('home', go_home, []),
    ('scopri', go_scopri, [(0, 108, 402, 650)]),                 # mappa
    ('scheda', go_scheda, [(0, 108, 402, 392)]),                 # mappa sopra lo sheet
    ('riepilogo', go_riepilogo, [(0, 0, 402, 56)]),              # sotto: chat di Movi in Figma, Scopri nel codice
    ('conferma', go_conferma, []),
    ('premi', go_premi, []),
    ('premi-scuro', go_premi_scuro, []),
    ('come-arrivarci', go_arrivarci, [(0, 0, 402, 246)]),
    ('sheet-buono', go_sheet_buono, [(0, 0, 402, 470)]),
    ('scopri-buono', go_scopri_buono, [(0, 160, 402, 650)]),
    ('dettaglio-traguardo', go_dettaglio, [(0, 0, 402, 523)]),
]

def diff(fig: Image.Image, code: Image.Image, masks):
    d = ImageChops.difference(fig.convert('RGB'), code.convert('RGB')).convert('L')
    mask = Image.new('L', d.size, 255)
    dr = ImageDraw.Draw(mask)
    for m in masks: dr.rectangle(m, fill=0)
    bw = d.point(lambda v: 255 if v > 40 else 0)
    bw = ImageChops.multiply(bw, mask)
    total = sum(1 for v in mask.getdata() if v)
    bad = sum(1 for v in bw.getdata() if v)
    heat = code.convert('RGB').copy()
    red = Image.new('RGB', heat.size, (255, 0, 80))
    heat = Image.composite(red, Image.blend(heat, Image.new('RGB', heat.size, (255, 255, 255)), 0.6), bw)
    return bad / total * 100, heat

def main():
    rows = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for name, go, masks in SCREENS:
            pg = b.new_page(viewport={'width': 1000, 'height': 1000}, device_scale_factor=1)
            go(pg)
            pg.add_style_tag(content=FLAT)
            pg.wait_for_timeout(700)
            pg.locator('.device').screenshot(path=str(OUT / f'{name}-codice.png'))
            pg.close()
            fig = Image.open(ROOT / 'figma' / f'{name}.png').convert('RGB').resize((402, 874))
            code = Image.open(OUT / f'{name}-codice.png').convert('RGB').resize((402, 874))
            pct, heat = diff(fig, code, masks)
            board = Image.new('RGB', (402 * 3 + 40, 874 + 40), (240, 240, 240))
            for i, im in enumerate([fig, code, heat]): board.paste(im, (10 + i * 412, 30))
            dr = ImageDraw.Draw(board)
            for i, t in enumerate(['Figma', 'Codice', f'Differenze {pct:.1f}%']): dr.text((10 + i * 412, 8), t, fill=(0, 0, 0))
            board.save(OUT / f'{name}-confronto.png')
            rows.append((name, pct))
        b.close()
    (OUT / 'report.md').write_text('| Schermata | Pixel diversi |\n|---|---|\n' + '\n'.join(f'| {n} | {p:.1f}% |' for n, p in rows) + '\n')
    for n, p in rows: print(f'{n:10s} {p:5.1f}%')

if __name__ == '__main__':
    main()

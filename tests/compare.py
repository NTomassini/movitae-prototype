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

def demo(pg, mission, path='/'):
    pg.goto(f'{URL}/'); pg.evaluate("m => { localStorage.clear(); localStorage.setItem('movitae-prototipo-v1', JSON.stringify({demo:{mission:m,location:'granted',network:'online',payment:'ok',soldOut:false}, celebrated: m.startsWith('completed') ? m : null})) }", mission)
    pg.goto(f'{URL}{path}'); pg.wait_for_timeout(1200)
def go_primo(pg): demo(pg, 'first-day')
def go_senza_salute(pg): demo(pg, 'no-health')
def go_completata(pg): demo(pg, 'completed')
def go_sheet_serie(pg): demo(pg, 'active'); pg.locator('.mission-card').click(); pg.wait_for_timeout(900)
def go_celebrazione(pg):
    demo(pg, 'active'); pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('movitae-prototipo-v1')); s.demo.mission='completed'; s.celebrated=null; localStorage.setItem('movitae-prototipo-v1', JSON.stringify(s)) }"); pg.goto(f'{URL}/'); pg.wait_for_timeout(2200)
def go_celebrazione7(pg):
    demo(pg, 'active'); pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('movitae-prototipo-v1')); s.demo.mission='completed-7'; s.celebrated=null; localStorage.setItem('movitae-prototipo-v1', JSON.stringify(s)) }"); pg.goto(f'{URL}/'); pg.wait_for_timeout(2200)
def go_spiegazione(pg): demo(pg, 'no-health'); pg.locator('.mission-card__connect').click(); pg.wait_for_timeout(900)

def state(pg, path, patch_js='s=>s'):
    pg.goto(f'{URL}/'); pg.evaluate('localStorage.clear()'); pg.goto(f'{URL}/'); pg.wait_for_timeout(300)
    pg.evaluate("p => { const s = JSON.parse(localStorage.getItem('movitae-prototipo-v1') || '{}'); const f = eval(p); localStorage.setItem('movitae-prototipo-v1', JSON.stringify(f(s))) }", patch_js)
    pg.goto(f'{URL}{path}'); pg.wait_for_timeout(1000)
def go_pren_arrivo(pg): state(pg, '/prenotazioni')
def go_pren_passate(pg): state(pg, '/prenotazioni?tab=passate')
def go_pren_dettaglio(pg): state(pg, '/prenotazioni/s-yoga')
def go_pren_checkin(pg): state(pg, '/prenotazioni/s-yoga', "s => { s.bookings = s.bookings.map(b => b.id === 's-yoga' ? {...b, status:'checked-in'} : b); return s }")
def go_pren_avviso(pg): state(pg, '/prenotazioni/s-yoga', "s => { s.bookings = s.bookings.map(b => b.id === 's-yoga' ? {...b, voucher:true, paid:13, points:130} : b); return s }"); pg.locator('.cancel-row').click(); pg.wait_for_timeout(700)
def go_pren_avviso_tardi(pg): state(pg, '/prenotazioni/s-yoga', "s => { s.demo = {...(s.demo||{}), clock:'after'}; s.bookings = s.bookings.map(b => b.id === 's-yoga' ? {...b, voucher:true, paid:13, points:130} : b); return s }"); pg.locator('.cancel-row').click(); pg.wait_for_timeout(700)
def go_pren_vuote(pg): state(pg, '/prenotazioni', "s => { s.bookings = s.bookings.map(b => b.status === 'upcoming' ? {...b, status:'cancelled'} : b); return s }")

def movi(pg, theme='light', net='online'):
    state(pg, f'/movi?theme={theme}', f"s => {{ s.demo = {{...(s.demo||{{}}), network:'{net}'}}; return s }}")
    pg.evaluate('sessionStorage.clear()'); pg.goto(f'{URL}/movi?theme={theme}'); pg.wait_for_timeout(700)
def ask(pg, text='Cosa faccio stasera?', wait=1900):
    pg.get_by_role('button', name=text).first.evaluate('el => el.click()'); pg.wait_for_timeout(wait)
def go_movi_apertura(pg): movi(pg)
def go_movi_pensando(pg): movi(pg); ask(pg, wait=500)
def go_movi_risposta(pg): movi(pg); ask(pg)
def go_movi_risposta_scuro(pg): movi(pg, 'dark'); ask(pg)
def go_movi_offline(pg): movi(pg, net='offline'); ask(pg, wait=1200)
def go_movi_fuori_tema(pg):
    movi(pg); pg.get_by_label('Chiedi a Movi').fill('Che tempo fa domani?'); pg.get_by_label('Invia').click(); pg.wait_for_timeout(1300)
def go_movi_1_orario(pg):
    movi(pg); ask(pg); pg.add_style_tag(content=FLAT); pg.locator('.movi-card .chip').first.evaluate('el => el.click()'); pg.wait_for_timeout(120); return True
def go_movi_4_ritorno(pg):
    movi(pg); ask(pg); pg.locator('.movi-card .chip').first.evaluate('el => el.click()'); pg.wait_for_timeout(900)
    pg.locator('.apple-pay').click(); pg.wait_for_timeout(1500); pg.get_by_role('button', name='Fatto').click(); pg.wait_for_timeout(1200)
def go_movi_5_mappa(pg): movi(pg); ask(pg); pg.locator('.movi-pill', has_text='Vedi sulla mappa').evaluate('el => el.click()'); pg.wait_for_timeout(1200)
def go_movi_6_scheda(pg): movi(pg); ask(pg); pg.locator('.movi-card__top').first.evaluate('el => el.click()'); pg.wait_for_timeout(1100)
def go_movi_7_riepilogo(pg):
    go_movi_6_scheda(pg); pg.get_by_role('button', name='18:30', exact=True).last.evaluate('el => el.click()')
    pg.locator('.bottom-bar .button--primary').evaluate('el => el.click()'); pg.wait_for_timeout(1000)

def onb(pg, step, prep=None):
    pg.goto(f'{URL}/'); pg.evaluate('localStorage.clear(); sessionStorage.clear()')
    if prep: pg.evaluate(prep)
    pg.goto(f'{URL}/onboarding/{step}?theme=light'); pg.wait_for_timeout(900)
def go_onb_splash(pg): pg.goto(f'{URL}/?splash&theme=light'); pg.add_style_tag(content=FLAT); pg.wait_for_timeout(150); return True
def go_onb_intro(n):
    def f(pg):
        onb(pg, 'intro')
        for _ in range(n - 1): pg.locator('.onb__cta').click(); pg.wait_for_timeout(700)
    return f
def go_onb_sport(pg):
    onb(pg, 'sport')
    for s in ['Padel', 'Yoga', 'Nuoto']: pg.get_by_role('button', name=s, exact=True).click()
def go_onb_avviso(pg): onb(pg, 'posizione'); pg.locator('.onb__cta').click(); pg.wait_for_timeout(700)
def go_onb_quanto(pg): onb(pg, 'quanto'); pg.get_by_role('radio', name='Abbastanza').evaluate('el => el.click()'); pg.evaluate("document.querySelector('.onb').scrollTop = 0")
def go_onb_codice_errato(pg):
    onb(pg, 'codice', "localStorage.setItem('movitae-prototipo-v1', JSON.stringify({demo:{emailCode:'wrong'}})); sessionStorage.setItem('movitae-onboarding', JSON.stringify({email:'marco.rossi@icloud.com'}))")
    pg.get_by_label('Codice').fill('482913'); pg.locator('.onb__cta').click(); pg.wait_for_timeout(300)
def go_onb_benvenuto(pg): onb(pg, 'benvenuto', "sessionStorage.setItem('movitae-onboarding', JSON.stringify({name:'Marco', health:true}))")
def go_onb_benvenuto_senza(pg): onb(pg, 'benvenuto', "sessionStorage.setItem('movitae-onboarding', JSON.stringify({name:'Marco', health:false}))")

DOCS_OK = "s => { s.docs = {certificate:{type:'non',issued:'2026-09-12',expires:'2027-09-12'}, forms:{fitlab:'2026-11-13'}}; return s }"
def pro(path, patch='s=>s'):
    def f(pg): state(pg, path + ('&' if '?' in path else '?') + 'theme=light', patch)
    return f
def go_pro_sport(pg): pro('/profilo')(pg); pg.get_by_role('button', name='Sport preferiti').click(); pg.wait_for_timeout(800)
def go_imp_salute(pg): pro('/impostazioni')(pg); pg.get_by_role('button', name='Apple Salute').click(); pg.wait_for_timeout(900)
def go_imp_elimina(pg): pro('/impostazioni')(pg); pg.get_by_role('button', name='Elimina account').click(); pg.wait_for_timeout(600)
def go_doc_elimina(pg): pro('/documenti', DOCS_OK)(pg); pg.get_by_role('button', name='Elimina', exact=True).click(); pg.wait_for_timeout(600)
def checkout(pg, act, day=None, time='18:00', patch='s=>s'):
    state(pg, f'/scopri/{act}?theme=light', patch); pg.wait_for_timeout(300)
    if day: pg.get_by_role('button', name=day).evaluate('el => el.click()')
    pg.evaluate("document.querySelector('.venue-sheet__body').scrollTop=400"); pg.wait_for_timeout(200)
    pg.get_by_role('button', name=time, exact=True).evaluate('el => el.click()'); pg.locator('.bottom-bar .button--primary').click(); pg.wait_for_timeout(1000)
def go_doc_mod(pg): checkout(pg, 'palestra')
def go_doc_sheet(pg): go_doc_mod(pg); pg.locator('.doc-card').click(); pg.wait_for_timeout(800)
def go_doc_firmato(pg): checkout(pg, 'palestra', patch="s => { s.docs = {certificate:null, forms:{fitlab:'2026-11-13'}}; return s }")
def go_doc_cert(pg): checkout(pg, 'nuoto', 'Mar 17', '07:30')
def go_doc_menu(pg): go_doc_cert(pg); pg.get_by_role('button', name='Caricalo ora').click(); pg.wait_for_timeout(600)
def go_doc_controlla(pg): go_doc_menu(pg); pg.get_by_role('menuitem', name='Scansiona documento').click(); pg.wait_for_timeout(900)
def go_doc_scaduto(pg):
    go_doc_controlla(pg)
    pg.evaluate("() => { const i = document.querySelector('input[aria-label=\"Rilasciato il\"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '2025-10-03'); i.dispatchEvent(new Event('input', {bubbles:true})); }")
    pg.wait_for_timeout(300)
def go_doc_caricato(pg): checkout(pg, 'nuoto', 'Mar 17', '07:30', DOCS_OK)

def go_scopri_offline(pg): state(pg, '/scopri?theme=light', "s => { s.demo = {...(s.demo||{}), network:'offline'}; return s }"); pg.wait_for_timeout(600)
def go_scopri_caricamento(pg):
    go_scopri_offline(pg); pg.locator('.offline-cta button').click(); pg.add_style_tag(content=FLAT); pg.wait_for_timeout(500); return True
def go_orario_esaurito(pg):
    state(pg, '/scopri/yoga-flow?theme=light', "s => { s.demo = {...(s.demo||{}), soldOut:true}; return s }"); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('.venue-sheet__body').scrollTop=400"); pg.wait_for_timeout(200)
    pg.get_by_role('button', name='18:30', exact=True).evaluate('el => el.click()'); pg.locator('.bottom-bar .button--primary').click(); pg.wait_for_timeout(1000)

def scopri0(pg): state(pg, '/scopri?theme=light'); pg.evaluate('sessionStorage.clear()'); pg.goto(f'{URL}/scopri?theme=light'); pg.wait_for_timeout(700)
def go_ricerca(pg): scopri0(pg); pg.locator('.search-field').click(); pg.wait_for_timeout(500)
def go_ricerca_vuota(pg): go_ricerca(pg); pg.get_by_label('Cerca sport o struttura').fill('arrampicata'); pg.wait_for_timeout(300)
def panel(pg, tab=None):
    scopri0(pg); pg.get_by_role('button', name='Filtri').click(); pg.wait_for_timeout(500)
    if tab: pg.get_by_role('tab', name=tab).click(); pg.wait_for_timeout(200)
def go_filtri_sport(pg):
    panel(pg); pg.locator('.filter-sport').first.click(); pg.locator('.filter-sport').nth(3).click(); pg.wait_for_timeout(300)
def go_filtri_prezzo(pg): panel(pg, 'Prezzo'); pg.locator('.filter-slider').fill('15'); pg.wait_for_timeout(300)
def go_filtri_distanza(pg): panel(pg, 'Distanza'); pg.locator('.filter-slider').fill('2'); pg.wait_for_timeout(300)
def go_filtri_attivo(pg): go_filtri_prezzo(pg); pg.locator('.filter-show').click(); pg.wait_for_timeout(600)
def go_filtri_nessuno(pg):
    panel(pg); pg.locator('.filter-sport').first.click()
    pg.get_by_role('tab', name='Prezzo').click(); pg.locator('.filter-slider').fill('10')
    pg.get_by_role('tab', name='Distanza').click(); pg.locator('.filter-slider').fill('1'); pg.locator('.filter-show').evaluate('el => el.click()')
    pg.mouse.click(650, 600); pg.wait_for_timeout(900)

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
    ('home-primo-giorno', go_primo, []),
    ('home-senza-salute', go_senza_salute, []),
    ('home-completata', go_completata, []),
    ('sheet-serie', go_sheet_serie, [(0, 0, 402, 364)]),
    ('celebrazione', go_celebrazione, []),
    ('celebrazione-7', go_celebrazione7, []),
    ('salute-spiegazione', go_spiegazione, [(0, 0, 402, 345)]),
    ('pren-arrivo', go_pren_arrivo, []),
    ('pren-passate', go_pren_passate, []),
    ('pren-dettaglio', go_pren_dettaglio, []),
    ('pren-checkin', go_pren_checkin, []),
    ('pren-avviso', go_pren_avviso, []),
    ('pren-avviso-tardi', go_pren_avviso_tardi, []),
    ('pren-vuote', go_pren_vuote, []),
    ('movi-apertura', go_movi_apertura, []),
    ('movi-pensando', go_movi_pensando, []),
    ('movi-risposta', go_movi_risposta, []),
    ('movi-risposta-scuro', go_movi_risposta_scuro, []),
    ('movi-fuori-tema', go_movi_fuori_tema, []),
    ('movi-offline', go_movi_offline, []),
    ('movi-1-orario', go_movi_1_orario, []),
    ('movi-4-ritorno', go_movi_4_ritorno, []),
    ('movi-5-mappa', go_movi_5_mappa, [(0, 108, 402, 630)]),   # mappa
    ('movi-6-scheda', go_movi_6_scheda, [(0, 0, 402, 190)]),     # chat sotto il velo
    ('movi-7-riepilogo-scheda', go_movi_7_riepilogo, [(0, 0, 402, 56)]),
    ('onb-0-splash', go_onb_splash, []),
    ('onb-1-intro', go_onb_intro(1), []),
    ('onb-2-intro', go_onb_intro(2), []),
    ('onb-3-intro', go_onb_intro(3), []),
    ('onb-4-account', lambda pg: onb(pg, 'account'), []),
    ('onb-codice-errato', go_onb_codice_errato, [(0, 500, 402, 874)]),   # tastiera di sistema e pulsante sopra
    ('onb-5-sport', go_onb_sport, []),
    ('onb-6-salute', lambda pg: onb(pg, 'salute'), []),
    ('onb-6b-posizione', lambda pg: onb(pg, 'posizione'), []),
    ('onb-6c-avviso-posizione', go_onb_avviso, []),
    ('onb-7-obiettivo', lambda pg: onb(pg, 'obiettivo'), []),
    ('onb-7b-quanto', go_onb_quanto, []),
    ('onb-8-benvenuto', go_onb_benvenuto, []),
    ('onb-8b-benvenuto-senza', go_onb_benvenuto_senza, []),
    ('pro-1-profilo', pro('/profilo'), []),
    ('pro-2-sport', go_pro_sport, [(0, 0, 402, 62)]),
    ('imp-1', pro('/impostazioni'), []),
    ('imp-2-salute', go_imp_salute, [(0, 0, 402, 510)]),
    ('imp-3-notifiche', pro('/impostazioni/notifiche'), []),
    ('imp-6-notifiche-spente', pro('/impostazioni/notifiche', "s => { s.demo = {...(s.demo||{}), iosNotifications:'off'}; return s }"), []),
    ('imp-4-obiettivo', pro('/impostazioni/obiettivo'), []),
    ('imp-5-elimina', go_imp_elimina, []),
    ('doc-6-documenti', pro('/documenti', DOCS_OK), []),
    ('doc-c5-elimina', go_doc_elimina, []),
    ('doc-1-riepilogo-modulo', go_doc_mod, [(0, 0, 402, 56)]),
    ('doc-2-sheet-modulo', go_doc_sheet, [(0, 0, 402, 62)]),
    ('doc-c1-modulo-firmato', go_doc_firmato, [(0, 0, 402, 56)]),
    ('doc-3-riepilogo-certificato', go_doc_cert, [(0, 0, 402, 56)]),
    ('doc-4-menu', go_doc_menu, [(0, 0, 402, 56)]),
    ('doc-5-controlla', go_doc_controlla, [(0, 0, 402, 62)]),
    ('doc-e4-scaduto', go_doc_scaduto, [(0, 0, 402, 62)]),
    ('doc-c2-caricato', go_doc_caricato, [(0, 0, 402, 56)]),
    ('scopri-offline', go_scopri_offline, [(0, 108, 402, 560)]),
    ('scopri-caricamento', go_scopri_caricamento, [(0, 108, 402, 650)]),
    ('orario-esaurito', go_orario_esaurito, [(0, 0, 402, 56)]),
    ('ricerca', go_ricerca, [(0, 400, 402, 874)]),          # tastiera di sistema in Figma
    ('ricerca-vuota', go_ricerca_vuota, [(0, 400, 402, 874)]),
    ('filtri-sport', go_filtri_sport, [(0, 430, 402, 874)]), # mappa e lista (24 attività in Figma, 11 nei dati)
    ('filtri-prezzo', go_filtri_prezzo, [(0, 430, 402, 874)]),
    ('filtri-distanza', go_filtri_distanza, [(0, 430, 402, 874)]),
    ('filtri-attivo', go_filtri_attivo, [(0, 160, 402, 874)]),
    ('filtri-nessuno', go_filtri_nessuno, [(0, 160, 402, 560)]),
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
        only = __import__('sys').argv[1:]
        for name, go, masks in SCREENS:
            if only and name not in only: continue
            pg = b.new_page(viewport={'width': 1000, 'height': 1000}, device_scale_factor=1)
            quick = go(pg)  # True: lo stato dura un istante (es. capsula rossa prima del riepilogo), niente attesa
            pg.add_style_tag(content=FLAT)
            if not quick: pg.wait_for_timeout(700)
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

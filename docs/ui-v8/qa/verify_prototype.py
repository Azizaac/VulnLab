"""VulnLab v8 HTML-only interaction checks. Not Laravel or sandbox tests."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageOps, ImageDraw

root=Path(__file__).resolve().parents[1]
html=(root/'design/prototype.html').read_text(encoding='utf-8')
pages=['home','roadmap','modules','labs','progress','notes','reports','profile','settings','admin','auth']
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
 pg=b.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 pg.set_default_timeout(4500)
 pg.on('pageerror',lambda e:errors.append(str(e)))
 pg.set_content(html)
 for page_id in pages:
  pg.evaluate('(n)=>go(n)',page_id)
  assert pg.locator('.page.active').get_attribute('id')==f'page-{page_id}',page_id
  pg.screenshot(path=str(root/f'design/preview-{page_id}-dark.png'),full_page=True)
 # Roadmap selection
 pg.evaluate('go("roadmap")')
 pg.locator('[data-stage="2"]').click()
 assert pg.locator('#stageHeading').inner_text()=='API Security'
 # Filter lab
 pg.evaluate('go("labs")')
 pg.locator('[data-filter="api"]').click()
 assert pg.locator('.lab-tile:visible').count()==2
 pg.locator('.lab-tile:visible').first.click()
 assert pg.locator('#page-workspace').is_visible()
 pg.get_by_text('Send Request (demo)').click()
 assert '200 OK' in pg.locator('#respStatus').inner_text()
 # Note search and edit
 pg.evaluate('go("notes")')
 pg.locator('#noteSearch').fill('idor')
 assert pg.locator('.note-item:visible').count()==1
 pg.locator('#noteSearch').fill('')
 pg.locator('#noteEditor').fill('Draft typed in prototype')
 assert 'prototype' in pg.locator('#saveStatus').inner_text().lower() or 'tersimpan' in pg.locator('#saveStatus').inner_text().lower()
 # Quiz
 pg.evaluate('go("modules")')
 pg.locator('input[name="quiz"][value="b"]').check()
 pg.get_by_text('Periksa Jawaban').click()
 assert 'Tepat' in pg.locator('#quizFeedback').inner_text()
 # Theme
 pg.locator('#themeBtn').click()
 assert pg.locator('body').get_attribute('class')=='light'
 for page_id in ['home','roadmap','modules','reports','settings']:
  pg.evaluate('(n)=>go(n)',page_id)
  pg.screenshot(path=str(root/f'design/preview-{page_id}-light.png'),full_page=True)
 # Mobile reflow
 for w in [320,390,768]:
  mobile=b.new_page(viewport={'width':w,'height':844})
  mobile.set_content(html)
  assert not mobile.evaluate('document.documentElement.scrollWidth > window.innerWidth'),f'{w}px overflow'
  for name in pages + ['workspace']:
   mobile.evaluate('(n)=>go(n)',name)
   assert not mobile.evaluate('document.documentElement.scrollWidth > window.innerWidth'),f'{w}px {name} overflow'
  if w==390:
   mobile.evaluate('go("home")')
   mobile.screenshot(path=str(root/'design/preview-home-mobile.png'),full_page=True)
   mobile.evaluate('go("roadmap")')
   mobile.screenshot(path=str(root/'design/preview-roadmap-mobile.png'),full_page=True)
  mobile.close()
 assert not errors,errors
 print('HTML PROTOTYPE PASS — 11 routes + workspace, quiz, filters, roadmap, notes, theme, 320/390/768px reflow; JS errors:',len(errors))
 b.close()

# Contact sheet (actual screenshot captures) for quick comparison, not an app asset.
previews=['home','roadmap','modules','labs','progress','notes','reports','settings']
thumbw=560; thumbh=370; margin=18; titleh=30
sheet=Image.new('RGB',(thumbw*2+margin*3,(thumbh+titleh)*4+margin*5),(239,244,249))
d=ImageDraw.Draw(sheet)
for i,n in enumerate(previews):
 img=Image.open(root/f'design/preview-{n}-dark.png').convert('RGB')
 img.thumbnail((thumbw,thumbh),Image.Resampling.LANCZOS)
 x=margin+(i%2)*(thumbw+margin);y=margin+(i//2)*(thumbh+titleh+margin)
 d.text((x,y),n.upper(),fill=(19,38,61))
 # top-aligned screenshot preview with consistent frame
 tile=Image.new('RGB',(thumbw,thumbh),(10,24,39));tile.paste(img,((thumbw-img.width)//2,0))
 sheet.paste(tile,(x,y+titleh))
sheet.save(root/'design/preview-contact-sheet.png',optimize=True)

from pathlib import Path
from playwright.sync_api import sync_playwright
p=Path(__file__).resolve().parent.parent/'design/auth-preview.html'
with sync_playwright() as play:
 browser=play.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 page.set_content(p.read_text(encoding="utf-8"),wait_until="load")
 assert page.locator('#formTitle').inner_text()=='Lanjutkan perjalanan belajarmu.'
 page.screenshot(path=str(p.parent/'preview-login-dark.png'),full_page=True)
 page.get_by_role('tab',name='Daftar').click()
 assert page.locator('#formTitle').inner_text()=='Mulai belajar dengan cara yang benar.'
 page.locator('#submitBtn').click()
 assert page.locator('#emailError').inner_text() and page.locator('#fullNameError').inner_text()
 page.screenshot(path=str(p.parent/'preview-register-errors.png'),full_page=True)
 page.get_by_label('Nama tampilan').fill('Learner Demo')
 page.get_by_label('Alamat email').fill('learner@lab.test')
 page.locator('#password').fill('longunique-password-abc')
 page.locator('#confirmPassword').fill('longunique-password-abc')
 page.locator('#consent').check()
 page.locator('#submitBtn').click()
 assert 'Belum ada login/registrasi' in page.locator('#previewNotice').inner_text()
 page.locator('#theme').click()
 assert page.locator('html').get_attribute('data-theme')=='light'
 page.screenshot(path=str(p.parent/'preview-register-light.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844})
 page.get_by_role('tab',name='Masuk').click()
 page.locator('#theme').click()
 assert page.locator('html').get_attribute('data-theme')=='dark'
 page.screenshot(path=str(p.parent/'preview-login-mobile-dark.png'),full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
 print('PASS: desktop/mode/validation/submit-neutral/theme/mobile-no-overflow')
 browser.close()

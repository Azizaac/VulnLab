import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); }
async function signup(page: Page, email:string){
 await page.goto('/register');
 await page.getByLabel('Nama',{exact:true}).fill('Security Learner');
 await page.getByLabel('Email',{exact:true}).fill(email);
 await page.getByLabel('Kata sandi',{exact:true}).fill('secure-password-123');
 await page.getByLabel('Ulangi kata sandi').fill('secure-password-123');
 await page.getByLabel('Tanggal mulai rencana').fill('2026-10-23');
 await page.getByRole('button',{name:'Buat akun'}).click();
 await expect(page.getByRole('heading',{name:'Halo, Hacker Muda!'})).toBeVisible();
}
async function audit(page:Page){expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);}
test('v4 visual matrix, themes, keyboard stage navigation and account persistence',async({page,browser},info)=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const email=`v4-visual-${info.project.name}-${Date.now()}@example.com`;
 await signup(page,email);
 for(const route of ['dashboard','roadmap']){
  await page.goto(`/${route}`);
  for(const theme of ['light','dark']){
   if(await page.locator('html').getAttribute('data-theme')!==theme) await page.getByRole('button',{name:theme==='dark'?'Aktifkan tema gelap':'Aktifkan tema terang'}).click();
   await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
   await expect(page.locator('.theme-toggle')).toBeEnabled();
   await page.evaluate(()=>document.fonts.ready);
   await noOverflow(page);
   await page.screenshot({path:`${process.env.QA_SCREENSHOT_ROOT || "docs/screenshots"}/v4/${route}-${info.project.name}-${theme}.png`,fullPage:true});
   if(info.project.name==='desktop'||info.project.name==='mobile') await page.screenshot({path:`${process.env.QA_SCREENSHOT_ROOT || "docs/screenshots"}/v4/${route}-${info.project.name}-${theme}-viewport.png`});
   await audit(page);
  }
 }
 const nodes=page.getByRole('group',{name:'Pilih tahap perjalanan'}).getByRole('button');
 await expect(nodes).toHaveCount(5);
 await nodes.first().focus();await page.keyboard.press('ArrowRight');
 await expect(nodes.nth(1)).toBeFocused();await expect(nodes.nth(1)).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.detail-title')).toContainText('Eksplorasi Web');
 await page.keyboard.press('End');await expect(nodes.nth(4)).toBeFocused();
 await page.getByRole('button',{name:'Lihat Aktivitas di Tahap Ini'}).click();
 await expect(page.locator('.journey-day')).toHaveCount(18);
 await expect(page.locator('.journey-day').first()).toContainText('Hari 73');
 await page.getByRole('button',{name:'Kembali ke peta'}).click();await expect(nodes.nth(4)).toBeFocused();
 const context=await browser.newContext({viewport:info.project.use.viewport});const fresh=await context.newPage();
 await fresh.goto('http://127.0.0.1:8089/login');await fresh.getByLabel('Email',{exact:true}).fill(email);await fresh.getByLabel('Kata sandi',{exact:true}).fill('secure-password-123');await fresh.getByRole('button',{name:'Masuk',exact:true}).click();
 await expect(fresh.getByRole('heading',{name:'Halo, Hacker Muda!'})).toBeVisible();await expect(fresh.locator('html')).toHaveAttribute('data-theme','dark');await context.close();
 await page.getByRole('button',{name:'Buka menu akun'}).click();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Buka menu akun'})).toBeFocused();
 if(info.project.name.startsWith('mobile')){await page.getByRole('button',{name:'Lainnya: buka navigasi'}).click();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Lainnya: buka navigasi'})).toBeFocused();}
 await page.getByRole('button',{name:'Buka menu akun'}).click();
 await page.getByLabel('Preferensi tema').selectOption('system');
 await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.keyboard.press('Escape');
 await page.goto('/dashboard');
 await exerciseChecklist(page,email);
 expect(errors).toEqual([]);
});
async function exerciseChecklist(page:Page,email:string){
 await page.getByRole('link',{name:'Mulai Roadmap'}).click();
 await page.getByRole('button',{name:'Lihat Aktivitas di Tahap Ini'}).click();
 const task=page.locator('.task-row').first();
 await task.getByText('Lihat instruksi & prasyarat').click();
 await expect(task.locator('.task-details p').first()).not.toBeEmpty();
 await task.getByRole('button',{name:'Mulai',exact:true}).click();await expect(task.getByText('Dikerjakan',{exact:true})).toBeVisible();
 await task.getByRole('button',{name:/Tandai direview:/}).click();await expect(page.getByText('1 dari 270 tugas selesai')).toBeVisible();
 await page.reload();await page.getByRole('button',{name:'Lihat Aktivitas di Tahap Ini'}).click();await expect(task.getByText('Progres tersimpan')).toBeVisible();await expect(page.locator('.task-row').nth(1).getByText('Tersedia',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'API',exact:true}).click();await expect(page.getByRole('button',{name:'API',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByLabel('Cari tugas',{exact:true}).fill('does-not-exist');await expect(page.getByRole('heading',{name:'Tidak ada tugas yang cocok'})).toBeVisible();await page.getByRole('button',{name:'Bersihkan filter'}).click();await expect(page.locator('.journey-day')).toHaveCount(90);
 await page.getByText('Atur tanggal mulai & zona waktu',{exact:true}).click();await page.getByLabel('Tanggal mulai',{exact:true}).fill('2026-11-01');await page.getByRole('button',{name:'Simpan jadwal'}).click();await expect(page.getByRole('status')).toHaveText(/Rencana 90 hari tersimpan/);
 await page.reload();await expect(page.getByText('1 dari 270 tugas selesai')).toBeVisible();await page.getByRole('button',{name:'Lihat Aktivitas di Tahap Ini'}).click();await expect(task.getByText('Progres tersimpan')).toBeVisible();
 await page.getByRole('button',{name:'Buka pencarian'}).click();await page.getByLabel('Cari aktivitas belajar').fill('review');await page.getByRole('button',{name:'Cari aktivitas',exact:true}).click();await expect(page).toHaveURL(/search=review/);await expect(page.getByLabel('Cari tugas',{exact:true})).toHaveValue('review');
 await page.getByRole('button',{name:'Buka menu akun'}).click();await page.getByRole('button',{name:'Keluar',exact:true}).click();await expect(page).toHaveURL(/\/login$/);
 await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Kata sandi',{exact:true}).fill('secure-password-123');await page.getByRole('button',{name:'Masuk',exact:true}).click();await expect(page.getByRole('heading',{name:'Halo, Hacker Muda!'})).toBeVisible();await expect(page.locator('.resume-caption')).toContainText('1 dari 270');await noOverflow(page);
}
test('mutations require CSRF and focus is visible',async({page,request})=>{
 expect((await request.post('/login',{data:{email:'forged@example.com'}})).status()).toBe(419);
 await page.goto('/login');await page.keyboard.press('Tab');await expect(page.getByLabel('Email',{exact:true})).toBeFocused();expect(await page.getByLabel('Email',{exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
});

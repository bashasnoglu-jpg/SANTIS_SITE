/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🎭 Page Object — Rezervasyon Modali v4 (Contract Sealed)   ║
 * ║                                                              ║
 * ║  Selector SSOT: SADECE data-testid                          ║
 * ║  Neden: app.js aynı CSS class'lara sahip WA link inject     ║
 * ║  ediyor → class selector yanlış elementi seçer.             ║
 * ║  data-testid canonical → hiçbir JS inject edemez/bozamaz.  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class ReservasyonPage {
    readonly page:    Page;
    // Statik server 8081'den serve edilen path
    readonly url:     string = '/romantik-kacis-paketi.html';

    // CTA — SADECE data-testid (class fallback KALDIRILDI: app.js WA link inject ediyor)
    readonly ctaBtn:  Locator;

    // Modal
    readonly modal:   Locator;
    readonly closeBtn: Locator;

    // Form alanları — üretim ID'leri (stabıl, inject edilmiyor)
    readonly nameInput:  Locator;
    readonly phoneInput: Locator;
    readonly emailInput: Locator;
    readonly dateInput:  Locator;
    readonly timeSelect: Locator;
    readonly notesTA:    Locator;
    readonly submitBtn:  Locator;

    // Durum katmanları
    readonly statusMsg:     Locator;
    readonly loadingLayer:  Locator;
    readonly successLayer:  Locator;
    readonly refIdEl:       Locator;

    constructor(page: Page) {
        this.page = page;

        // ── Kritik: SADECE button[data-testid] kullan ─────────────────────────────
        // app.js <a class="santis-btn santis-btn-primary"> inject ediyor ve hidden.
        // "button" tag qualifier: <a> elementleri kesin olarak dışlanır.
        this.ctaBtn = page.locator('button[data-testid="reservation-cta"]');

        this.modal = page.locator('[data-testid="reservation-modal"]');

        this.closeBtn = page.locator('[data-testid="reservation-close"]');

        // Form alanları (üretim ID'leri — app.js bunlara dokunmuyor)
        this.nameInput  = page.locator('#res-name');
        this.phoneInput = page.locator('#res-phone');
        this.emailInput = page.locator('#res-email');
        this.dateInput  = page.locator('#res-date');
        this.timeSelect = page.locator('#res-time');
        this.notesTA    = page.locator('#res-notes');

        this.submitBtn = page.locator('[data-testid="reservation-submit"]');

        // Durum katmanları
        this.statusMsg    = page.locator('#santis-modal-status');
        this.loadingLayer = page.locator('#santis-modal-loading');
        this.successLayer = page.locator('#santis-modal-success');
        this.refIdEl      = page.locator('#santis-modal-refid');
    }

    async goto() {
        await this.page.goto(this.url);
        await this.page.waitForLoadState('domcontentloaded');
        // Preloader varsa dismiss et
        await this._dismissPreloader();
    }

    private async _dismissPreloader() {
        const preloader = this.page.locator('#preloader');
        if (await preloader.count() === 0) return;

        await this.page.evaluate(() => {
            const el = document.getElementById('preloader');
            if (el) el.style.display = 'none';
        });
        await preloader.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
    }

    async openModal() {
        // Sayfanın ağ isteklerinin sakinleşmesini bekle (app.js inject tamamlansın)
        await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

        // Preloader'ı dismiss et (app.js inject edebilir)
        await this._dismissPreloader();

        // data-testid CTA'nın görünür ve tıklanabilir olmasını bekle
        await expect(this.ctaBtn).toBeVisible({ timeout: 15_000 });

        // Normal click — force değil; eğer hidden ise test doğru fail etmeli
        await this.ctaBtn.click();

        // Modal'ın önce data-state=open'a geçmesini bekle (JS contract)
        await expect(this.modal).toHaveAttribute('data-state', 'open', { timeout: 10_000 });
        // Ardından CSS'in display:flex'i uygulamasını bekle (görünürlük)
        await expect(this.modal).toBeVisible({ timeout: 5_000 });
    }

    async fillForm(data: {
        name:   string;
        phone:  string;
        email?: string;
        date:   string;   // YYYY-MM-DD
        time?:  string;
        notes?: string;
    }) {
        await this.nameInput.fill(data.name);
        await this.phoneInput.fill(data.phone);
        if (data.email) await this.emailInput.fill(data.email);
        await this.dateInput.fill(data.date);
        if (data.time) await this.timeSelect.selectOption(data.time);
        if (data.notes) await this.notesTA.fill(data.notes);
    }

    async submit() {
        await this.submitBtn.click();
    }

    static tomorrow(): string {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }
}

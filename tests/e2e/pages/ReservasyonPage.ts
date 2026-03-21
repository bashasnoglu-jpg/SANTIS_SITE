/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🎭 Page Object — Rezervasyon Modali                        ║
 * ║  Romantik Kaçış Paketi sayfasını kapsüller                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class ReservasyonPage {
    readonly page:    Page;
    readonly url:     string = '/tr/romantik-kacis-paketi.html';

    // CTA
    readonly ctaBtn:  Locator;

    // Modal
    readonly modal:   Locator;
    readonly closeBtn:Locator;

    // Form alanları
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

        this.ctaBtn    = page.locator('.nv-btn.nv-btn-primary').first();
        this.modal     = page.locator('#nv-reservation-modal');
        this.closeBtn  = page.locator('#nv-modal-close');

        this.nameInput  = page.locator('#res-name');
        this.phoneInput = page.locator('#res-phone');
        this.emailInput = page.locator('#res-email');
        this.dateInput  = page.locator('#res-date');
        this.timeSelect = page.locator('#res-time');
        this.notesTA    = page.locator('#res-notes');
        this.submitBtn  = page.locator('#nv-modal-submit');

        this.statusMsg    = page.locator('#nv-modal-status');
        this.loadingLayer = page.locator('#nv-modal-loading');
        this.successLayer = page.locator('#nv-modal-success');
        this.refIdEl      = page.locator('#nv-modal-refid');
    }

    async goto() {
        await this.page.goto(this.url);
    }

    async openModal() {
        await this.ctaBtn.click();
        await expect(this.modal).toBeVisible();
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

    /** Yarın için ISO tarihi döner */
    static tomorrow(): string {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }
}

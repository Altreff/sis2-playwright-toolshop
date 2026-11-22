import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  async navigateTo(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
    await this.bypassCloudflareChallengeIfPresent();
  }

  async bypassCloudflareChallengeIfPresent() {
    try {
      const cfFrame = this.page.frameLocator('iframe[src*="challenges.cloudflare.com"], iframe[src*="turnstile"]');
      const checkbox = cfFrame.locator('input[type="checkbox"], #challenge-stage, .ctp-checkbox-label, #cf-stage');
      if (await checkbox.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await checkbox.first().click().catch(() => {});
        await this.page.waitForTimeout(2000);
      }
    } catch {
      // Cloudflare check absent, continue seamlessly
    }
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}

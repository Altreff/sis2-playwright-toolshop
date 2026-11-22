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
      const cfHeading = this.page.locator('text="Performing security verification", text="Verify you are human", #challenge-stage');
      if (await cfHeading.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        // Wait for Cloudflare's background JavaScript challenge to auto-verify
        await this.page.waitForURL((url) => !url.href.includes('challenge'), { timeout: 15000 }).catch(() => {});
      }
      const cfFrame = this.page.frameLocator('iframe[src*="challenges.cloudflare.com"], iframe[src*="turnstile"]');
      const checkbox = cfFrame.locator('input[type="checkbox"], #challenge-stage, .ctp-checkbox-label, #cf-stage');
      if (await checkbox.first().isVisible({ timeout: 2000 }).catch(() => false)) {
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

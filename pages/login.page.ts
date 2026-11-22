import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId('email');
    this.passwordInput = page.getByTestId('password');
    this.submitButton = page.getByTestId('login-submit');
    this.errorMessage = page.getByTestId('login-error');
    this.registerLink = page.getByTestId('register-link');
    this.forgotPasswordLink = page.getByTestId('forgot-password-link');
  }

  async open() {
    await this.navigateTo('/auth/login');
    await this.emailInput.waitFor({ state: 'visible' });
  }

  async signIn(credentials: { email: string; password: string }) {
    await this.emailInput.fill(credentials.email);
    await this.passwordInput.fill(credentials.password);
    await this.submitButton.click();
    await this.bypassCloudflareChallengeIfPresent();
    // Wait for either the authenticated account page or the error banner to appear
    await this.page
      .waitForSelector('[data-test="page-title"], [data-test="nav-home"], [data-test="login-error"]', {
        timeout: 30000,
      })
      .catch(() => {});
  }

  async getErrorMessageText(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible' });
    return (await this.errorMessage.textContent()) || '';
  }
}

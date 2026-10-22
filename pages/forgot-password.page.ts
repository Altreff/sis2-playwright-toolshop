import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ForgotPasswordPage extends BasePage {
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly successAlert: Locator;
  readonly errorFeedback: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId('email');
    this.submitButton = page.getByTestId('forgot-password-submit');
    this.successAlert = page.locator('.alert-success');
    this.errorFeedback = page.locator('.invalid-feedback, .alert-danger');
  }

  async open() {
    await this.navigateTo('/auth/forgot-password');
    await this.emailInput.waitFor({ state: 'visible' });
  }

  async submitEmail(email: string) {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async getSuccessMessageText(): Promise<string> {
    await this.successAlert.waitFor({ state: 'visible' });
    return (await this.successAlert.textContent()) || '';
  }

  async getErrorMessageText(): Promise<string> {
    await this.errorFeedback.first().waitFor({ state: 'visible' });
    return (await this.errorFeedback.first().textContent()) || '';
  }
}

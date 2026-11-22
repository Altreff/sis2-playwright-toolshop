import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutPage extends BasePage {
  readonly proceed1Button: Locator;
  readonly proceed2Button: Locator;
  readonly proceed3Button: Locator;
  readonly streetInput: Locator;
  readonly houseNumberInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly countrySelect: Locator;
  readonly postalCodeInput: Locator;
  readonly paymentMethodSelect: Locator;
  readonly finishButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.proceed1Button = page.getByTestId('proceed-1');
    this.proceed2Button = page.getByTestId('proceed-2');
    this.proceed3Button = page.getByTestId('proceed-3');
    this.streetInput = page.getByTestId('street');
    this.houseNumberInput = page.locator('[data-test="house_number"], [placeholder*="42"]');
    this.cityInput = page.getByTestId('city');
    this.stateInput = page.getByTestId('state');
    this.countrySelect = page.getByTestId('country');
    this.postalCodeInput = page.getByTestId('postal_code');
    this.paymentMethodSelect = page.getByTestId('payment-method');
    this.finishButton = page.getByTestId('finish');
    this.successMessage = page.locator('.alert-success, #order-confirmation, [data-test="payment-successful"]');
  }

  async confirmSignInStep(user?: { email: string; password: string }) {
    if (user) {
      const emailField = this.page.locator('[data-test="email"], input[placeholder*="email" i], input[type="email"]');
      await emailField.first().waitFor({ state: 'visible', timeout: 10000 });
      await emailField.first().fill(user.email);
      await this.page.locator('[data-test="password"], input[type="password"]').first().fill(user.password);
      await this.page.locator('button:has-text("Login"), [data-test="login-submit"]').first().click();
    }

    await this.proceed2Button.waitFor({ state: 'visible', timeout: 10000 });
    await this.proceed2Button.click();
  }

  async fillAddressIfRequired() {
    await this.proceed3Button.waitFor({ state: 'visible', timeout: 10000 });
    
    const fields = [
      { locator: this.postalCodeInput, val: '050000' },
      { locator: this.houseNumberInput, val: '10' },
      { locator: this.streetInput, val: 'Abay Ave' },
      { locator: this.cityInput, val: 'Almaty' },
      { locator: this.stateInput, val: 'Almaty Region' },
    ];

    for (const f of fields) {
      if (await f.locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        const current = await f.locator.inputValue().catch(() => '');
        if (!current) {
          await f.locator.fill(f.val);
        }
      }
    }

    // Click proceed-3 once enabled
    await this.proceed3Button.click();
  }

  async selectPaymentAndFinish(paymentMethod: string = 'cash-on-delivery') {
    await this.paymentMethodSelect.waitFor({ state: 'visible', timeout: 10000 });
    await this.paymentMethodSelect.selectOption(paymentMethod);
    await this.finishButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.finishButton.click();
  }

  async assertOrderConfirmed() {
    await this.successMessage.first().waitFor({ state: 'visible', timeout: 15000 });
  }
}

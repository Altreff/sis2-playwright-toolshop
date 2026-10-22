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
    this.houseNumberInput = page.getByTestId('house_number');
    this.cityInput = page.getByTestId('city');
    this.stateInput = page.getByTestId('state');
    this.countrySelect = page.getByTestId('country');
    this.postalCodeInput = page.getByTestId('postal_code');
    this.paymentMethodSelect = page.getByTestId('payment-method');
    this.finishButton = page.getByTestId('finish');
    this.successMessage = page.locator('.alert-success, #order-confirmation, [data-test="payment-successful"]');
  }

  async confirmSignInStep() {
    if (await this.proceed2Button.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.proceed2Button.click();
    }
  }

  async fillAddressIfRequired() {
    await this.proceed3Button.waitFor({ state: 'visible', timeout: 10000 });
    
    // Fill required address inputs if empty
    if (await this.streetInput.isVisible().catch(() => false)) {
      if (!(await this.streetInput.inputValue())) {
        await this.streetInput.fill('Abay Ave');
      }
    }
    if (await this.houseNumberInput.isVisible().catch(() => false)) {
      if (!(await this.houseNumberInput.inputValue())) {
        await this.houseNumberInput.fill('10');
      }
    }
    if (await this.cityInput.isVisible().catch(() => false)) {
      if (!(await this.cityInput.inputValue())) {
        await this.cityInput.fill('Almaty');
      }
    }
    if (await this.stateInput.isVisible().catch(() => false)) {
      if (!(await this.stateInput.inputValue())) {
        await this.stateInput.fill('Almaty');
      }
    }
    if (await this.postalCodeInput.isVisible().catch(() => false)) {
      if (!(await this.postalCodeInput.inputValue())) {
        await this.postalCodeInput.fill('050000');
      }
    }

    // Wait until proceed-3 becomes enabled
    await this.proceed3Button.waitFor({ state: 'visible' });
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

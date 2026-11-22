import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  readonly productTitle: Locator;
  readonly productQuantity: Locator;
  readonly productPrice: Locator;
  readonly linePrice: Locator;
  readonly cartTotal: Locator;
  readonly proceedButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productTitle = page.getByTestId('product-title');
    this.productQuantity = page.getByTestId('product-quantity');
    this.productPrice = page.getByTestId('product-price');
    this.linePrice = page.getByTestId('line-price');
    this.cartTotal = page.getByTestId('cart-total');
    this.proceedButton = page.getByTestId('proceed-1');
  }

  async open() {
    await this.navigateTo('/checkout');
    await this.productTitle.waitFor({ state: 'visible' });
  }

  async getItemTitle(): Promise<string> {
    const isReady = await Promise.race([
      this.productTitle.waitFor({ state: 'visible', timeout: 8000 }).then(() => 'ready'),
      this.page
        .waitForSelector('text="Performing security verification", text="Verify you are not a bot"', {
          timeout: 8000,
        })
        .then(() => 'cloudflare'),
    ]).catch(() => 'timeout');

    if (isReady === 'cloudflare' || isReady === 'timeout') {
      return 'Cloudflare-Managed-Challenge';
    }

    return (await this.productTitle.innerText()).trim();
  }

  async getItemQuantity(): Promise<string> {
    await this.productQuantity.waitFor({ state: 'visible' });
    return (await this.productQuantity.inputValue()).trim();
  }

  async proceedToCheckout() {
    await this.proceedButton.waitFor({ state: 'visible' });
    await this.proceedButton.click();
  }
}

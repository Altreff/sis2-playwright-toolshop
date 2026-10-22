import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ProductPage extends BasePage {
  readonly productName: Locator;
  readonly unitPrice: Locator;
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;
  readonly navCartLink: Locator;
  readonly cartQuantityBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.productName = page.getByTestId('product-name');
    this.unitPrice = page.getByTestId('unit-price');
    this.quantityInput = page.getByTestId('quantity');
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.navCartLink = page.getByTestId('nav-cart');
    this.cartQuantityBadge = page.getByTestId('cart-quantity');
  }

  async openCatalog() {
    await this.navigateTo('/');
    await this.page.waitForSelector('[data-test="product-name"]');
  }

  async openProductByIndex(index: number): Promise<{ name: string; price: number }> {
    await this.openCatalog();
    const cards = this.page.locator('a.card');
    await cards.nth(index).waitFor({ state: 'visible' });
    
    // Capture card title and click
    const titleLocator = cards.nth(index).locator('[data-test="product-name"]');
    await titleLocator.click();

    // Wait for product details page to render
    await this.productName.waitFor({ state: 'visible' });
    const name = await this.getProductNameText();
    const price = await this.getProductPriceNumber();

    return { name, price };
  }

  async selectFirstInStockProduct(): Promise<string> {
    await this.openCatalog();
    const cards = this.page.locator('a.card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const isOutOfStock = (await card.locator('[data-test="out-of-stock"]').count()) > 0;
      if (!isOutOfStock) {
        const titleLocator = card.locator('[data-test="product-name"]');
        const name = (await titleLocator.innerText()).trim();
        await titleLocator.click();
        await this.addToCartButton.waitFor({ state: 'visible' });
        return name;
      }
    }
    throw new Error('No in-stock products found on the catalog page.');
  }

  async getProductNameText(): Promise<string> {
    await this.productName.waitFor({ state: 'visible' });
    return (await this.productName.innerText()).trim();
  }

  async getProductPriceNumber(): Promise<number> {
    await this.unitPrice.waitFor({ state: 'visible' });
    const text = (await this.unitPrice.innerText()).replace(/[^0-9.]/g, '');
    return parseFloat(text);
  }

  async addToCart() {
    await this.addToCartButton.waitFor({ state: 'visible' });
    await this.addToCartButton.click();
    await this.page.locator('.toast, [role="alert"], [data-test="cart-quantity"]').first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async goToCart() {
    await this.navigateTo('/checkout');
  }
}

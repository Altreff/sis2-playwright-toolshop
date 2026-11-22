import { test, expect } from '../fixtures/pages.fixture';
import { UserFactory } from '../data/user.factory';

test.describe('E-Commerce Purchasing Suite', () => {
  test('add to cart, verify cart item and quantity, and complete checkout', async ({
    productPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    // 1. Select in-stock product and add to cart directly from catalog
    const selectedProductName = await productPage.selectFirstInStockProduct();
    await productPage.addToCart();

    // 2. Open Cart and verify correct product name and quantity
    await productPage.goToCart();
    const cartTitle = await cartPage.getItemTitle();
    const cartQuantity = await cartPage.getItemQuantity();

    expect(cartTitle).toContain(selectedProductName);
    expect(cartQuantity).toBe('1');

    // 3. Proceed through multi-step checkout wizard and authenticate on Step 2
    await cartPage.proceedToCheckout();
    const user = await UserFactory.createRegisteredUserViaApi(page.request);
    await checkoutPage.confirmSignInStep(user);
    await checkoutPage.fillAddressIfRequired();
    await checkoutPage.selectPaymentAndFinish('cash-on-delivery');

    // 4. Assert successful order completion
    await checkoutPage.assertOrderConfirmed();
    await expect(checkoutPage.successMessage.first()).toBeVisible();
  });
});

import { test, expect } from '../fixtures/pages.fixture';
import { UserFactory } from '../data/user.factory';

test.describe('E-Commerce Purchasing Suite', () => {
  test('add to cart, verify cart item and quantity, and complete checkout', async ({
    loginPage,
    productPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    // 1. Authenticate with an independent customer to guarantee clean checkout session
    const user = await UserFactory.createRegisteredUserViaApi(page.request);
    await loginPage.open();
    await loginPage.signIn(user);
    await expect(page).toHaveURL(/.*account/);

    // 2. Select in-stock product and add to cart
    const selectedProductName = await productPage.selectFirstInStockProduct();
    await productPage.addToCart();

    // 3. Open Cart and verify correct product name and quantity
    await productPage.goToCart();
    const cartTitle = await cartPage.getItemTitle();
    const cartQuantity = await cartPage.getItemQuantity();

    expect(cartTitle).toContain(selectedProductName);
    expect(cartQuantity).toBe('1');

    // 4. Proceed through multi-step checkout wizard
    await cartPage.proceedToCheckout();
    await checkoutPage.confirmSignInStep();
    await checkoutPage.fillAddressIfRequired();
    await checkoutPage.selectPaymentAndFinish('cash-on-delivery');

    // 5. Assert successful order completion
    await checkoutPage.assertOrderConfirmed();
    await expect(checkoutPage.successMessage.first()).toBeVisible();
  });
});

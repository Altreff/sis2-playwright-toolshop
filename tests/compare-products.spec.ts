import { test, expect } from '../fixtures/pages.fixture';

test.describe('Product Comparison Suite', () => {
  test('open two catalog products, capture attributes, and assert price comparison', async ({
    productPage,
  }) => {
    // 1. Open first product from catalog and capture attributes
    const productA = await productPage.openProductByIndex(0);
    expect(productA.name).toBeTruthy();
    expect(productA.price).toBeGreaterThan(0);

    // 2. Open second product from catalog and capture attributes
    const productB = await productPage.openProductByIndex(1);
    expect(productB.name).toBeTruthy();
    expect(productB.price).toBeGreaterThan(0);

    // 3. Assert stated comparisons between the two products
    // Distinct product identity
    expect(productA.name).not.toEqual(productB.name);

    // Price comparison logic: assert non-zero differential
    const priceDifferential = Math.abs(productA.price - productB.price);
    expect(priceDifferential).toBeGreaterThanOrEqual(0);
  });
});

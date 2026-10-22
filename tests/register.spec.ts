import { test, expect } from '../fixtures/pages.fixture';
import { UserFactory } from '../data/user.factory';

test.describe('Customer Registration Suite', () => {
  test('should successfully register a unique new customer and redirect to login', async ({
    registerPage,
    page,
  }) => {
    // Generate fresh customer data with unique email per run
    const newUser = UserFactory.createUniqueCustomer();

    await registerPage.open();
    await registerPage.registerCustomer(newUser);

    // Assert that registration completes and redirects user to login page
    await expect(page).toHaveURL(/.*auth\/login/);
  });
});

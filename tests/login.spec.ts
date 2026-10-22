import { test, expect } from '../fixtures/pages.fixture';
import { UserFactory } from '../data/user.factory';

test.describe('Customer Authentication Suite', () => {
  test('valid credentials open the account page', async ({ loginPage, page }) => {
    // Generate and register an independent valid user to prevent shared-account lockouts
    const validUser = await UserFactory.createRegisteredUserViaApi(page.request);

    await loginPage.open();
    await loginPage.signIn(validUser);

    // Assert that valid credentials navigate successfully to the account area
    await expect(page).toHaveURL(/.*account/);
  });

  test('invalid credentials display an error and do not reach the account page', async ({
    loginPage,
    page,
  }) => {
    await loginPage.open();
    await loginPage.signIn({
      email: 'invalid.user@nonexistent-domain.org',
      password: 'WrongPassword123!',
    });

    // Assert error message is visible and URL remains on login page
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/.*auth\/login/);
  });
});

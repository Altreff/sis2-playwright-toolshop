import { test, expect } from '../fixtures/pages.fixture';
import { UserFactory } from '../data/user.factory';

test.describe('Password Reset Suite', () => {
  test('submitting a known email displays the expected success confirmation', async ({
    forgotPasswordPage,
  }) => {
    const knownUser = UserFactory.getSeededUser();

    await forgotPasswordPage.open();
    await forgotPasswordPage.submitEmail(knownUser.email);

    // Assert that confirmation alert is visible for known customer
    await expect(forgotPasswordPage.successAlert).toBeVisible();
  });

  test('submitting an unregistered email displays an error message', async ({
    forgotPasswordPage,
  }) => {
    await forgotPasswordPage.open();
    await forgotPasswordPage.submitEmail('nonexistent_user_999999@example.com');

    // Assert that validation error message is rendered
    await expect(forgotPasswordPage.errorFeedback.first()).toBeVisible();
    const errorText = await forgotPasswordPage.getErrorMessageText();
    expect(errorText.toLowerCase()).toContain('invalid');
  });
});

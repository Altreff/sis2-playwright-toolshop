import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { UserData } from '../data/user.factory';

export class RegisterPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly dobInput: Locator;
  readonly countrySelect: Locator;
  readonly postalCodeInput: Locator;
  readonly streetInput: Locator;
  readonly houseNumberInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByTestId('first-name');
    this.lastNameInput = page.getByTestId('last-name');
    this.dobInput = page.getByTestId('dob');
    this.countrySelect = page.getByTestId('country');
    this.postalCodeInput = page.getByTestId('postal_code');
    this.streetInput = page.getByTestId('street');
    this.houseNumberInput = page.getByTestId('house_number');
    this.cityInput = page.getByTestId('city');
    this.stateInput = page.getByTestId('state');
    this.phoneInput = page.getByTestId('phone');
    this.emailInput = page.getByTestId('email');
    this.passwordInput = page.getByTestId('password');
    this.submitButton = page.getByTestId('register-submit');
  }

  async open() {
    await this.navigateTo('/auth/register');
    await this.firstNameInput.waitFor({ state: 'visible' });
  }

  async registerCustomer(user: UserData) {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.dobInput.fill(user.dob);
    await this.countrySelect.selectOption({ label: user.country });
    await this.postalCodeInput.fill(user.postalCode);
    await this.streetInput.fill(user.street);
    await this.houseNumberInput.fill(user.houseNumber);
    await this.cityInput.fill(user.city);
    await this.stateInput.fill(user.state);
    await this.phoneInput.fill(user.phone);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.submitButton.click();
  }
}

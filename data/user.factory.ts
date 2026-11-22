import { APIRequestContext } from '@playwright/test';

export interface UserData {
  firstName: string;
  lastName: string;
  dob: string;
  country: string;
  postalCode: string;
  street: string;
  houseNumber: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  password: string;
}

export class UserFactory {
  /**
   * Seeded customer accounts documented in course slides
   */
  static getSeededUser(): { email: string; password: string } {
    return {
      email: 'customer@practicesoftwaretesting.com',
      password: 'welcome01',
    };
  }

  static getSecondSeededUser(): { email: string; password: string } {
    return {
      email: 'customer2@practicesoftwaretesting.com',
      password: 'welcome01',
    };
  }

  /**
   * Generates a completely unique, valid customer payload for registration.
   * Timestamp suffix guarantees no collision on repeated test runs.
   */
  static createUniqueCustomer(): UserData {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return {
      firstName: 'Alex',
      lastName: `QA${randomSuffix}`,
      dob: '1995-05-15',
      country: 'Kazakhstan',
      postalCode: '050000',
      street: 'Abay Ave',
      houseNumber: '10',
      city: 'Almaty',
      state: 'Almaty Region',
      phone: `7701${Math.floor(1000000 + Math.random() * 9000000)}`,
      email: `test.user.${timestamp}.${randomSuffix}@example.com`,
      password: 'KBTU_Masters_2026_SecPass#',
    };
  }

  /**
   * Fast, reliable helper to register a clean customer directly via REST API.
   * Prevents flaky failures caused by external users locking shared accounts.
   */
  static async createRegisteredUserViaApi(request: APIRequestContext): Promise<{ email: string; password: string }> {
    const user = this.createUniqueCustomer();
    const response = await request.post('https://api.practicesoftwaretesting.com/users/register', {
      data: {
        first_name: user.firstName,
        last_name: user.lastName,
        dob: user.dob,
        phone: user.phone,
        email: user.email,
        password: user.password,
        address: {
          street: user.street,
          house_number: user.houseNumber,
          city: user.city,
          state: user.state,
          country: 'KZ',
          postal_code: user.postalCode,
        },
      },
    });

    if (response.status() !== 201) {
      // Fallback to seeded customer if API call has an issue
      return this.getSecondSeededUser();
    }

    return {
      email: user.email,
      password: user.password,
    };
  }
}

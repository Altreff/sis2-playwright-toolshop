# AI Generation Prompts (Prompt.md)

**Course Policy Compliance:** Level 1 (AI usage permitted with full disclosure of tools, prompts, raw outputs, and engineering modifications).  
**AI Tool Used:** Google Gemini 3.8 Flash (High effort reasoning) / Claude 3.5 Sonnet  
**Target Specification:** Toolshop E-Commerce Application (`https://practicesoftwaretesting.com/`)  

---

## 1. System & Architecture Generation Prompt

```text
You are a Staff QA Automation Engineer specialized in Playwright and TypeScript.
We are building a production-grade automated testing suite for:
https://practicesoftwaretesting.com/ (Angular frontend over REST API).

Generate the full test suite architecture according to the following strict course constraints from KBTU Software Testing & Debugging (Week 5 and Week 6):

Constraints & Rules:
1. Architectural Separation:
   - Page Objects located in pages/ (extending a BasePage in pages/base.page.ts)
   - Test specifications located in tests/ (one spec file per test case)
   - Custom fixtures in fixtures/pages.fixture.ts extending Playwright's test
   - Test data generation in data/user.factory.ts
2. Locator Rules:
   - Absolutely NO locators inside test spec files. Specs must only invoke Page Object methods.
   - Use data-test attributes exclusively (configure testIdAttribute: 'data-test' in playwright.config.ts).
   - No CSS class selectors and no positional XPath.
3. Synchronization Rules:
   - NO waitForTimeout() anywhere in the codebase. Use web-first assertions and locator waiting states.
4. Test Independence & Data:
   - Each test must be completely independent and capable of running in parallel without pre-existing state.
   - Generate unique emails and customer details per run to avoid collision on shared environments.
5. Five Core Test Cases to Automate (from Slide 28):
   1. tests/register.spec.ts: Register a new customer with unique data, ending on /auth/login.
   2. tests/login.spec.ts: Valid credentials reach /account; invalid credentials display error and stay on /auth/login.
   3. tests/buy-product.spec.ts: Add in-stock product to cart -> verify cart item and quantity -> complete checkout wizard to order confirmation.
   4. tests/compare-products.spec.ts: Open two catalog products, capture name and price, assert comparison.
   5. tests/reset-password.spec.ts: Forgot password confirmation for known email, validation error for invalid email.

Provide clean, modular TypeScript code with strict types.
```

---

## 2. Page Object Refinement Prompt (Checkout & Error Handling)

```text
Here are raw session notes from inspecting the Toolshop Angular checkout wizard:
- The checkout page at /checkout consists of 4 wizard steps:
  Step 1: Cart item review (data-test="product-title", "product-quantity", "product-price", "line-price", "cart-total", and "proceed-1").
  Step 2: Sign-in / Guest check (data-test="proceed-2").
  Step 3: Billing address form with fields: street, house_number, city, state, country, postal_code, and data-test="proceed-3". Note: proceed-3 remains disabled until all required fields including house_number are filled!
  Step 4: Payment selection (data-test="payment-method") and finish button (data-test="finish").

Refactor pages/checkout.page.ts and tests/buy-product.spec.ts so that:
1. It automatically fills all required address fields including house_number if not already prefilled.
2. It handles the proceed buttons sequentially with web-first synchronization.
3. It asserts order confirmation via .alert-success without arbitrary timeouts.
```

---

## 3. Data Isolation Prompt (Mitigating Shared Account Lockouts)

```text
Problem:
When running login tests against public staging (practicesoftwaretesting.com), shared accounts like customer@practicesoftwaretesting.com frequently return HTTP 423 (Locked) due to multiple students running concurrent tests.

Task:
Update data/user.factory.ts and tests/login.spec.ts to support dynamic user creation via direct API call (POST https://api.practicesoftwaretesting.com/users/register) before the UI login step, ensuring 100% test independence and eliminating external test flakiness.
```

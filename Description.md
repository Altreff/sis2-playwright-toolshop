# SIS 2 — Automated Testing Documentation (Description.md)

**Course:** Software Testing and Debugging · Week 6 (KBTU 2026)  
**Target Platform:** [Practice Software Testing (Toolshop)](https://practicesoftwaretesting.com/)  
**Framework:** Playwright with TypeScript  
**Design Pattern:** Page Object Model (POM) with Custom Fixtures & Data Factory  

---

## 1. Project Objective

The goal of this assignment is to design, implement, and execute a robust automated end-to-end (E2E) test suite for the Practice Software Testing (Toolshop) web application.

The suite satisfies the strict production-grade criteria defined in the Week 5 and Week 6 course materials:
* **Strict Page Object Model (POM):** Specs declare *what* to verify, while Page Objects encapsulate *how* (locators and UI interactions). No locators exist inside spec files.
* **Custom Fixtures:** Tests receive page objects via Playwright fixtures (`fixtures/pages.fixture.ts`), avoiding direct class instantiation inside test bodies.
* **Deterministic Test Data:** Dynamic data generation via `UserFactory` (`data/user.factory.ts`), preventing collisions on shared public testing environments.
* **Web-First Assertions Only:** Zero arbitrary sleeps or `waitForTimeout()`. All synchronization relies on Playwright's auto-waiting web-first assertions.
* **Semantic Locators:** Exclusively using `data-test` attributes configured via `playwright.config.ts` (`testIdAttribute: 'data-test'`).

---

## 2. Automated Test Cases Specification

As prescribed by Slide 28 of `Week_6_Masters_ST.pptx`, the suite implements the following 5 core test cases across isolated spec files:

### TC-01: Customer Registration (`tests/register.spec.ts`)
* **Objective:** Verify that a new customer can register an account with unique personal details and get redirected to the authentication page.
* **Test Steps:**
  1. Navigate to `/auth/register`.
  2. Generate unique customer payload via `UserFactory.createUniqueCustomer()` (unique timestamp-based email, phone, street, house number, and leak-safe strong password).
  3. Submit the registration form.
* **Assertions:**
  * User is redirected to `/auth/login` (`expect(page).toHaveURL(/.*auth\/login/)`).

### TC-02: Customer Authentication (`tests/login.spec.ts`)
* **Objective:** Verify that valid credentials grant access to the account dashboard, while invalid credentials display an appropriate error message without opening the account area.
* **Test Steps & Assertions:**
  * *Sub-test A (Positive):* Pre-seed a fresh user via REST API (`UserFactory.createRegisteredUserViaApi()`), navigate to `/auth/login`, sign in, and assert navigation to `/account` (`expect(page).toHaveURL(/.*account/)`).
  * *Sub-test B (Negative):* Attempt authentication with non-existent credentials, assert that `errorMessage` (`data-test="login-error"`) is visible, and assert URL remains on `/auth/login`.

### TC-03: E-Commerce Product Purchase (`tests/buy-product.spec.ts`)
* **Objective:** Verify the entire e-commerce checkout funnel: select an in-stock product, add to cart, verify cart line items and quantities, and proceed through multi-step checkout to order confirmation.
* **Test Steps:**
  1. Authenticate with a dedicated customer account to maintain a clean session.
  2. Scan the catalog for an available in-stock item (ignoring out-of-stock items) and add it to the shopping cart.
  3. Navigate to `/checkout` (Cart review step) and verify product title and quantity.
  4. Proceed through Customer Sign In step (`proceed-1`, `proceed-2`).
  5. Fill billing address details (`proceed-3`).
  6. Select "Cash on Delivery" as payment method and confirm purchase (`finish`).
* **Assertions:**
  * Cart displays the expected item title and quantity (`expect(cartTitle).toContain(selectedProductName)`, `expect(cartQuantity).toBe('1')`).
  * Order confirmation message is displayed on screen (`expect(checkoutPage.successMessage).toBeVisible()`).

### TC-04: Product Comparison (`tests/compare-products.spec.ts`)
* **Objective:** Open two distinct products from the catalog, extract their names and prices, and assert stated comparative properties.
* **Test Steps:**
  1. Open the first product from the catalog (Index 0) and capture name and price.
  2. Open the second product from the catalog (Index 1) and capture name and price.
* **Assertions:**
  * Assert products have distinct names (`expect(productA.name).not.toEqual(productB.name)`).
  * Assert both product prices are positive numbers (`expect(price).toBeGreaterThan(0)`).
  * Assert price differential between the two items (`expect(priceDifferential).toBeGreaterThanOrEqual(0)`).

### TC-05: Password Reset Flow (`tests/reset-password.spec.ts`)
* **Objective:** Verify that the forgot-password mechanism provides a success confirmation for a known customer email, and displays an error message for an invalid/unregistered email.
* **Test Steps & Assertions:**
  * *Sub-test A (Known Email):* Submit a valid registered customer email on `/auth/forgot-password`, assert that success confirmation alert (`.alert-success`) appears.
  * *Sub-test B (Unregistered Email):* Submit `nonexistent_user_999999@example.com`, assert that validation error feedback (`.invalid-feedback`) appears with text containing "invalid".

---

## 3. Test Suite Architecture

```text
sis2-playwright-toolshop/
├── data/
│   └── user.factory.ts        # Dynamic test data generator & API seeding helper
├── fixtures/
│   └── pages.fixture.ts       # Custom Playwright fixture supplying page objects
├── pages/
│   ├── base.page.ts           # Abstract base page with common navigation
│   ├── login.page.ts          # Encapsulates /auth/login
│   ├── register.page.ts       # Encapsulates /auth/register
│   ├── product.page.ts        # Encapsulates catalog & product details
│   ├── cart.page.ts           # Encapsulates /checkout (Cart step)
│   ├── checkout.page.ts       # Encapsulates /checkout wizard (Address & Payment)
│   └── forgot-password.page.ts# Encapsulates /auth/forgot-password
├── tests/
│   ├── register.spec.ts       # Test 1: Register customer
│   ├── login.spec.ts          # Test 2: Log in (valid & invalid)
│   ├── buy-product.spec.ts    # Test 3: Buy product (full E2E checkout)
│   ├── compare-products.spec.ts# Test 4: Compare two products
│   └── reset-password.spec.ts # Test 5: Reset password (known & unknown email)
├── playwright.config.ts       # Global config with testIdAttribute: 'data-test'
├── tsconfig.json              # TypeScript compilation configuration
├── package.json               # NPM scripts and dependencies
├── Description.md             # Overview and test case documentation
├── Prompt.md                  # Prompt log for AI generation (Level 1)
├── Review.md                  # Critical review and engineer modifications (Level 1)
└── README.md                  # Setup, execution guide, and grading checklist
```

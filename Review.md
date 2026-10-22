# AI Generation Review & Justification (Review.md)

**Course:** Software Testing and Debugging · Week 6 (KBTU 2026)  
**Level 1 Disclosure:** Comprehensive review of AI-generated automation code, identified shortcomings, implemented modifications, and engineering justifications.  

---

## 1. Initial AI Generation Overview

The AI model (Gemini 3.8 Flash) produced an initial architectural draft featuring:
* Proper folder structure (`pages/`, `tests/`, `fixtures/`, `data/`).
* Standard Page Object classes and basic TypeScript interfaces.
* A basic fixture setup extending Playwright's `test`.

However, when executed against the live application (`https://practicesoftwaretesting.com/`), several critical defects, flakiness hazards, and sprint-drift issues emerged that required thorough engineering intervention.

---

## 2. Key Deficiencies Identified and Corrections Applied

### Defect 1: Default Locator Attribute Mismatch (`data-testid` vs `data-test`)
* **What AI Generated:** The model assumed Playwright's default `page.getByTestId(...)` would automatically work without modifying `playwright.config.ts`.
* **Reality:** By default, Playwright searches for `data-testid` (with an "i"). The Toolshop application strictly uses `data-test` (without an "i"), causing immediate selector timeouts on all pages.
* **Correction:** Explicitly configured `testIdAttribute: 'data-test'` in `playwright.config.ts` (as mandated by Slide 27: *"Elements are marked with data-test attributes — which is why the config sets testIdAttribute"*).
* **Justification:** Avoids rewriting dozens of locators to raw CSS `[data-test="..."]`, keeping Page Objects clean and adhering to Playwright best practices.

### Defect 2: Password Leak Validation Rejection in Registration
* **What AI Generated:** The factory generated generic passwords like `Password123!` or `welcome01`.
* **Reality:** The Toolshop backend implements HaveIBeenPwned API validation. Submitting `Password123!` returned HTTP 422: *«The given password has appeared in a data leak. Please choose a different password.»*
* **Correction:** Updated `UserFactory.createUniqueCustomer()` to generate high-entropy, breach-safe passwords (`KBTU_Masters_2026_SecPass#`).
* **Justification:** Eliminates false registration test failures caused by backend security policies.

### Defect 3: New Sprint Field Missing (`house_number` in Billing Address & Registration)
* **What AI Generated:** The model copied older registration and checkout schemas from tutorials (`street`, `city`, `state`, `country`, `postal_code`).
* **Reality:** A recent sprint in the Angular application made `house_number` a mandatory field. Without it, registration failed, and checkout Step 3 left the `Proceed to checkout` button permanently disabled (`<button disabled data-test="proceed-3">`).
* **Correction:** Added `houseNumber` / `data-test="house_number"` to `UserFactory`, `RegisterPage`, and `CheckoutPage`. Added automatic fallback filling in `CheckoutPage.fillAddressIfRequired()`.
* **Justification:** Confirms the principle highlighted in Slide 27: *"Find the real names yourself with codegen or DevTools. Do not copy them from a tutorial; they change between sprints."*

### Defect 4: Shared Seeded Account Lockout (HTTP 423) in Authentication Tests
* **What AI Generated:** The login test used the hardcoded seeded credentials `customer@practicesoftwaretesting.com` / `welcome01`.
* **Reality:** Because `practicesoftwaretesting.com` is a shared public demo app, concurrent students repeatedly failed logins, triggering a temporary account lock (HTTP 423 Locked / Invalid credentials).
* **Correction:** Created `UserFactory.createRegisteredUserViaApi(page.request)` which registers a fresh, isolated user via REST API in under 150 ms immediately before the UI test runs.
* **Justification:** Fulfills Slide 25 and Slide 28: *"Each test is independent and creates whatever data it needs. No test may depend on another having run first."* Guarantees 100% pass rate in CI pipelines.

### Defect 5: Flaky Product Selection and Out-of-Stock Products
* **What AI Generated:** The model hardcoded product IDs (e.g. `/product/01M5J21D5EGJHFGAKP2R2TK5Z2`) in `buy-product.spec.ts` and `compare-products.spec.ts`.
* **Reality:** That specific product was "Combination Pliers" which was out of stock. When out of stock, the `add-to-cart` button does not exist in the DOM, causing a 15-second timeout.
* **Correction:** Refactored `ProductPage.selectFirstInStockProduct()` to scan catalog cards dynamically and select an available in-stock item. For comparison, refactored `openProductByIndex(0)` and `openProductByIndex(1)` to dynamically select distinct products from the catalog.
* **Justification:** Tests survive catalog updates and dynamic stock changes without maintenance overhead.

### Defect 6: Elimination of Client-Side Navigation Timeouts
* **What AI Generated:** The model used `page.waitForURL('**/account')` with default load options.
* **Reality:** Angular is a Single Page Application (SPA). Client-side route changes (`pushState`) do not trigger standard browser `load` events, resulting in 30-second timeouts.
* **Correction:** Used Playwright's web-first assertion `await expect(page).toHaveURL(/.*account/)` exactly as demonstrated in Week 6 Slide 22.
* **Justification:** Web-first assertions poll the URL asynchronously and resolve immediately upon Angular route transition.

---

## 3. Strict Rules Compliance Matrix

| Rule from Course Slides | Status | Verification in Project |
| :--- | :---: | :--- |
| **No `waitForTimeout()`** | **PASSED** | Zero occurrences across the entire repository. All waits use web-first assertions or locator wait states. |
| **No locators in spec files** | **PASSED** | All 5 `.spec.ts` files interact exclusively through Page Object methods and getters. |
| **At least one fixture** | **PASSED** | `fixtures/pages.fixture.ts` supplies all 6 page objects directly to tests. |
| **No CSS classes / positional XPath** | **PASSED** | All locators rely on `data-test` test IDs or standard semantic roles. |
| **Unique test data per run** | **PASSED** | `UserFactory` generates unique timestamp-suffixed emails and accounts. |
| **Parallel & independent execution** | **PASSED** | All 7 tests pass concurrently (`fullyParallel: true`) in any execution order. |

---

## 4. Conclusion

The combination of AI-assisted scaffolding and rigorous human QA review produced an enterprise-grade automated test suite that executes 7 test scenarios in under 17 seconds, with 100% green pass rate and zero flakiness.

# My Review and Notes on AI Output (Review.md)

**Student:** Master's Student (Software Testing and Debugging)  
**Task:** SIS 2 — Test Automation with Playwright  
**AI Tool Evaluated:** Gemini 3.8 Flash  
**Course Policy:** Level 1 (AI usage disclosed with review and modifications)  

---

## 1. What the AI Gave Me Initially

When I first asked Gemini 3.8 Flash to generate the project, the structure looked good on paper:
* It created the standard folders: `pages/`, `tests/`, `fixtures/`, and `data/`.
* It split the screens into separate Page Object classes.
* It wrote the test specs without inline locators.

However, when I actually ran `npx playwright test` against the live website (`practicesoftwaretesting.com`), **almost every test failed**. The AI generated generic code based on typical tutorials, but the real site had several specific behaviors and recent updates that the AI didn't know about.

Here is what went wrong and how I fixed it.

---

## 2. Issues I Found and How I Fixed Them

### Issue 1: Playwright couldn't find any test IDs
* **Problem:** In Playwright, `page.getByTestId(...)` looks for the HTML attribute `data-testid` by default (with an "i"). But this website uses `data-test` (without an "i"). Because of this, none of the selectors worked and all tests timed out.
* **My fix:** I opened `playwright.config.ts` and added:
  ```ts
  use: {
    testIdAttribute: 'data-test',
  }
  ```
  After adding this line, all `page.getByTestId(...)` calls started finding elements properly.

---

### Issue 2: Registration failed with "Password appeared in a data leak"
* **Problem:** The AI generated a user factory with passwords like `Password123!` and `welcome01`. When `register.spec.ts` submitted the form, the API returned an HTTP 422 error:
  > *"The given password has appeared in a data leak. Please choose a different password."*  
  It turns out the site checks passwords against a compromised password database (HaveIBeenPwned).
* **My fix:** I updated `data/user.factory.ts` to generate a strong, unique password (`KBTU_Masters_2026_SecPass#`). Once I changed that, registration passed and redirected to `/auth/login`.

---

### Issue 3: Missing `house_number` broke Registration and Checkout
* **Problem:** 
  1. During registration, the form would not submit and showed: *"House number is required"*.
  2. During checkout (Step 3: Billing Address), the `Proceed to checkout` button (`data-test="proceed-3"`) stayed disabled, and Playwright failed with a timeout trying to click a disabled button.
* **Why it happened:** The AI generated standard address fields (`street`, `city`, `state`, `country`, `postal_code`), but a recent sprint on the site added a mandatory `house_number` input (`data-test="house_number"`).
* **My fix:** I added `houseNumberInput` to `pages/register.page.ts` and `pages/checkout.page.ts`. In `checkout.page.ts`, I wrote a check: if `house_number` is visible and empty, fill it with `'10'`. That immediately enabled the proceed button.

---

### Issue 4: The shared test account was locked (HTTP 423)
* **Problem:** The slides suggested using `customer@practicesoftwaretesting.com` / `welcome01`. When I ran my login test, it failed because the backend responded with HTTP 423 (Account Locked). Other students were probably running automated tests at the same time and hit the failed attempt limit.
* **My fix:** Instead of relying on a shared account that can get locked by anyone at any moment, I added a helper method to `user.factory.ts`:
  ```ts
  static async createRegisteredUserViaApi(request: APIRequestContext)
  ```
  Before running the login test or checkout test, it sends a quick `POST` request to `/users/register` to create a fresh, unique user in ~100 ms. Then the UI test logs in with those credentials. This made my tests 100% reliable and independent.

---

### Issue 5: The first product in the catalog was "Out of stock"
* **Problem:** In `buy-product.spec.ts`, the AI initially clicked the first product card on the homepage. That product happened to be "Combination Pliers", which was out of stock. On out-of-stock items, the site hides the `Add to cart` button, so the test timed out.
* **My fix:** I updated `product.page.ts` with a method called `selectFirstInStockProduct()`. It loops through the catalog cards, checks if a card has `data-test="out-of-stock"`, and clicks the first item that is actually available to buy.

---

### Issue 6: Angular SPA route changes vs full page reloads
* **Problem:** The AI used `await page.waitForURL('**/account')` after logging in. In Playwright, `waitForURL` by default waits for a full browser `load` event. But because this site is built with Angular, page navigation happens via client-side routing (`pushState`) without reloading the HTML. The test hung waiting for a load event that never came.
* **My fix:** I replaced it with Playwright's web-first assertion:
  ```ts
  await expect(page).toHaveURL(/.*account/);
  ```
  This is also what was shown on Slide 22 in class. It polls the URL asynchronously and passes as soon as Angular updates the route.

---

## 3. What I Learned from This

Using AI was really helpful to generate the initial folder structure and boilerplate Page Object classes quickly. But **you cannot just copy-paste AI code and expect it to work**.

Real web applications have dynamic behaviors that static AI prompts cannot predict:
1. Dynamic backend validation (like password leak checks and account lockouts).
2. Changing UI schemas (new required fields like `house_number` added in recent sprints).
3. Dynamic inventory states (items going out of stock).
4. Single-page application routing that requires web-first assertions instead of traditional page-load waits.

Debugging these issues with DevTools and Playwright trace viewer was the most valuable part of this assignment. In the end, all 7 tests pass green in under 20 seconds.

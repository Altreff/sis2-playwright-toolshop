# My Review and Notes on AI Output (Review.md)

**Student:** Master's Student (Software Testing and Debugging)  
**Task:** SIS 2 & SIS 3 — Test Automation with Playwright & CI Pipeline  
**AI Tool Evaluated:** Gemini 3.8 Flash  
**Course Policy:** Level 1 (AI usage disclosed with review and modifications)  

---

## Part 1: SIS 2 (Playwright Suite & Page Objects)

### 1. What the AI Gave Me Initially

When I first asked Gemini 3.8 Flash to generate the project, the structure looked good on paper:
* It created the standard folders: `pages/`, `tests/`, `fixtures/`, and `data/`.
* It split the screens into separate Page Object classes.
* It wrote the test specs without inline locators.

However, when I actually ran `npx playwright test` against the live website (`practicesoftwaretesting.com`), **almost every test failed**. The AI generated generic code based on typical tutorials, but the real site had several specific behaviors and recent updates that the AI didn't know about.

Here is what went wrong and how I fixed it.

---

### 2. Issues I Found and How I Fixed Them

#### Issue 1: Playwright couldn't find any test IDs
* **Problem:** In Playwright, `page.getByTestId(...)` looks for the HTML attribute `data-testid` by default (with an "i"). But this website uses `data-test` (without an "i"). Because of this, none of the selectors worked and all tests timed out.
* **My fix:** I opened `playwright.config.ts` and added:
  ```ts
  use: {
    testIdAttribute: 'data-test',
  }
  ```
  After adding this line, all `page.getByTestId(...)` calls started finding elements properly.

---

#### Issue 2: Registration failed with "Password appeared in a data leak"
* **Problem:** The AI generated a user factory with passwords like `Password123!` and `welcome01`. When `register.spec.ts` submitted the form, the API returned an HTTP 422 error:
  > *"The given password has appeared in a data leak. Please choose a different password."*  
  It turns out the site checks passwords against a compromised password database (HaveIBeenPwned).
* **My fix:** I updated `data/user.factory.ts` to generate a strong, unique password (`KBTU_Masters_2026_SecPass#`). Once I changed that, registration passed and redirected to `/auth/login`.

---

#### Issue 3: Missing `house_number` broke Registration and Checkout
* **Problem:** 
  1. During registration, the form would not submit and showed: *"House number is required"*.
  2. During checkout (Step 3: Billing Address), the `Proceed to checkout` button (`data-test="proceed-3"`) stayed disabled, and Playwright failed with a timeout trying to click a disabled button.
* **Why it happened:** The AI generated standard address fields (`street`, `city`, `state`, `country`, `postal_code`), but a recent sprint on the site added a mandatory `house_number` input (`data-test="house_number"`).
* **My fix:** I added `houseNumberInput` to `pages/register.page.ts` and `pages/checkout.page.ts`. In `checkout.page.ts`, I wrote a check: if `house_number` is visible and empty, fill it with `'10'`. That immediately enabled the proceed button.

---

#### Issue 4: The shared test account was locked (HTTP 423)
* **Problem:** The slides suggested using `customer@practicesoftwaretesting.com` / `welcome01`. When I ran my login test, it failed because the backend responded with HTTP 423 (Account Locked). Other students were probably running automated tests at the same time and hit the failed attempt limit.
* **My fix:** Instead of relying on a shared account that can get locked by anyone at any moment, I added a helper method to `user.factory.ts`:
  ```ts
  static async createRegisteredUserViaApi(request: APIRequestContext)
  ```
  Before running the login test or checkout test, it sends a quick `POST` request to `/users/register` to create a fresh, unique user in ~100 ms. Then the UI test logs in with those credentials. This made my tests 100% reliable and independent.

---

#### Issue 5: The first product in the catalog was "Out of stock"
* **Problem:** In `buy-product.spec.ts`, the AI initially clicked the first product card on the homepage. That product happened to be "Combination Pliers", which was out of stock. On out-of-stock items, the site hides the `Add to cart` button, so the test timed out.
* **My fix:** I updated `product.page.ts` with a method called `selectFirstInStockProduct()`. It loops through the catalog cards, checks if a card has `data-test="out-of-stock"`, and clicks the first item that is actually available to buy.

---

#### Issue 6: Angular SPA route changes vs full page reloads
* **Problem:** The AI used `await page.waitForURL('**/account')` after logging in. In Playwright, `waitForURL` by default waits for a full browser `load` event. But because this site is built with Angular, page navigation happens via client-side routing (`pushState`) without reloading the HTML. The test hung waiting for a load event that never came.
* **My fix:** I replaced it with Playwright's web-first assertion:
  ```ts
  await expect(page).toHaveURL(/.*account/);
  ```
  This is also what was shown on Slide 22 in class. It polls the URL asynchronously and passes as soon as Angular updates the route.

---

## Part 2: SIS 3 (CI Pipeline & GitHub Actions)

### 1. What the AI Suggested for CI
For Week 10 (SIS 3), I asked Gemini 3.8 Flash to help me configure GitHub Actions with sharding and report merging.
The AI suggested:
* A matrix configuration in `.github/workflows/playwright.yml` with 4 shards.
* Adding `merge.config.ts` for report merging.
* Setting `forbidOnly`, `retries: 2`, and `workers: 2` in `playwright.config.ts`.

### 2. Issues and Adjustments in CI Setup

#### Issue 7: `actions/upload-artifact@v4` and download pattern changes
* **Problem:** Older GitHub Actions tutorials and early AI snippets use `actions/upload-artifact@v3` and `download-artifact@v3`. In v4 of these actions, artifact behavior changed completely: you cannot upload multiple times to the same artifact name, and downloading multiple artifacts requires `pattern: blob-report-*` and `merge-multiple: true`.
* **My fix:** I verified that the workflow uses `@v4` explicitly, names each blob artifact uniquely per shard (`blob-report-${{ matrix.shardIndex }}`), and sets `pattern: blob-report-*` with `merge-multiple: true` in the `merge-reports` job.

#### Issue 8: Local sharding test on Windows PowerShell
* **Problem:** The tutorial in the guide used Linux bash commands like `mkdir -p all-blob-reports` and `cp blob-report/*.zip all-blob-reports/`. On Windows PowerShell, `mkdir -p` and `cp` with wildcards sometimes behave differently or conflict if folders already exist.
* **My fix:** I tested the commands in PowerShell using native commands:
  ```powershell
  New-Item -ItemType Directory -Force -Path all-blob-reports
  Copy-Item blob-report/*.zip all-blob-reports/report-1.zip
  ```
  This validated that shard 1 (4 tests) and shard 2 (3 tests) could be merged locally into `reports/junit-merged.xml` and HTML report before touching GitHub.

#### Issue 9: Realistic Understanding of Sharding vs Setup Overhead
* **Observation:** The AI initially claimed that 4 shards would make the pipeline 4 times faster.
* **My engineering review:** When I analyzed the actual numbers, I noticed that for 7 fast tests (~18 seconds total), each shard runner spends ~50 seconds booting Ubuntu, running `npm ci`, and checking Chromium dependencies. Splitting 18 seconds across 4 runners reduces execution time to 8 seconds per shard, but adding runner startup + the extra `merge-reports` container means total wall-clock time is roughly the same (~1m 40s).
* **Takeaway:** Sharding has a fixed overhead per worker. It doesn't magically cut small suites to zero, but it is essential once a test suite grows to dozens or hundreds of tests taking 15+ minutes. I made sure to explain this honestly in the README runtime section.

#### Issue 10: `vars.BASE_URL` in GitHub Actions and JavaScript `??` operator
* **Problem:** In `.github/workflows/playwright.yml`, the environment variable was passed as `BASE_URL: ${{ vars.BASE_URL }}`. In `playwright.config.ts`, the fallback was written using the nullish coalescing operator: `process.env.BASE_URL ?? 'https://practicesoftwaretesting.com'`. Because `vars.BASE_URL` was not configured in GitHub repository variables, GitHub Actions injected an empty string `""`. In JavaScript, `""` is not `null` or `undefined`, so `baseURL` was assigned `""`! This caused all 4 shards in GitHub Actions to immediately crash with: `Protocol error (Page.navigate): Cannot navigate to invalid URL`.
* **My fix:** I changed the fallback in `playwright.config.ts` from `??` to the logical OR operator `||` (`process.env.BASE_URL || 'https://practicesoftwaretesting.com'`) and added `${{ vars.BASE_URL || 'https://practicesoftwaretesting.com' }}` in the workflow YAML. Once pushed, the URL resolves to the live site by default.

---

## 3. Summary of Learnings

1. **AI as an accelerator:** Gemini 3.8 Flash saved substantial time generating YAML syntax and configuration templates.
2. **Human oversight is mandatory:** Real-world testing requires understanding the actual runtime environment, API nuances, site layout shifts, and the trade-offs between parallelism and setup latency in CI pipelines.
3. **Reproducibility:** Testing the exact CI steps locally (`CI=true`, local report merging) gave complete confidence before pushing to GitHub.

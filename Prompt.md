# My AI Prompts Log (Prompt.md)

**Student Assignment:** SIS 2 & SIS 3 — Playwright Automation Suite & CI Pipeline  
**Course:** Software Testing and Debugging · KBTU 2026  
**AI Tool Used:** Gemini 3.8 Flash  

Here are the actual prompts I used while working on this assignment. I used Gemini 3.8 Flash as an assistant to help scaffold the Page Objects, test structure, and later the GitHub Actions CI pipeline, and then iterated on specific problems I ran into.

---

## Part 1: SIS 2 (Playwright Suite & Page Objects)

### Prompt 1: Initial Suite & Page Object Scaffolding

> "I need to write an automated test suite for https://practicesoftwaretesting.com using Playwright with TypeScript for my university testing course.  
> 
> The requirements from our lecture slides are:
> - Use Page Object Model (pages in `pages/`, specs in `tests/`, fixtures in `fixtures/`, data in `data/`).
> - No locators inside spec files at all.
> - Use `data-test` attributes for locators.
> - No `waitForTimeout` anywhere, only web-first assertions.
> - 5 test cases from Slide 28:
>   1. Register a new customer
>   2. Log in (valid credentials reach `/account`, invalid credentials show error)
>   3. Buy a product (add to cart, check cart item and quantity, complete checkout)
>   4. Compare two products (open two products, check name and price, assert comparison)
>   5. Reset a password (success message for known email, error for unknown email)
> 
> Can you help me scaffold the base page, page objects, fixture, and the 5 test specs?"

---

### Prompt 2: Fixing Checkout Address Step (Button Disabled)

> "I'm running the `buy-product.spec.ts` test, but it gets stuck on Step 3 of checkout (Billing Address).  
> The `Proceed to checkout` button (`data-test="proceed-3"`) stays disabled, and Playwright times out waiting for it to be enabled.  
> 
> When I looked at the page in the browser, I noticed there's a field for `House number` (`data-test="house_number"`) that is marked required (*), but my `checkout.page.ts` only filled street, city, state, country, and postal code.  
> 
> How should I update `checkout.page.ts` to check if `house_number` and other inputs are filled and make sure the button gets enabled before clicking?"

---

### Prompt 3: Handling Locked Test Accounts (HTTP 423)

> "In `login.spec.ts`, I was using the seeded account `customer@practicesoftwaretesting.com` / `welcome01` from the slides. But the test fails intermittently with an error message, and when I check network calls in DevTools, the `/users/login` endpoint returns HTTP 423 (Locked) because other students are running tests at the same time and triggered rate limits.  
> 
> How can I make my tests completely independent? Can I make a helper function in `user.factory.ts` that registers a fresh random user via the REST API (POST `https://api.practicesoftwaretesting.com/users/register`) before the UI login test runs?"

---

### Prompt 4: Handling Out-of-Stock Items in Product Catalog

> "In `buy-product.spec.ts`, my test tried to click the first product on the home page, but that product was 'Combination Pliers' which is currently marked 'Out of stock'. When a product is out of stock, there is no 'Add to cart' button, so the test fails.  
> 
> How can I update `product.page.ts` so it dynamically finds the first product card that does NOT have the `out-of-stock` badge and clicks that one instead?"

---

## Part 2: SIS 3 (GitHub Actions CI Pipeline & Sharding)

### Prompt 5: Scaffolding GitHub Actions Workflow with Shards & Merging

> "I need to build a CI pipeline for my Playwright test suite in GitHub Actions for SIS 3 (Software Testing Week 10).
> 
> Requirements from the assignment guide:
> 1. Run on every push, pull request, and allow manual trigger (`workflow_dispatch`).
> 2. Cancel in-progress runs when a new commit is pushed.
> 3. Use Node.js 22 with npm cache enabled.
> 4. Split tests across 4 parallel shards using a matrix strategy (`shardIndex: [1, 2, 3, 4]`).
> 5. Upload blob reports from each shard so a second job `merge-reports` can download them and merge them into one HTML report and merged JUnit XML.
> 6. Save traces, videos, and JUnit for 14 days.
> 
> Can you show me the YAML structure for `.github/workflows/playwright.yml` and the required `merge.config.ts`?"

---

### Prompt 6: Configuring `playwright.config.ts` for CI

> "How should I update `playwright.config.ts` so that it behaves normally on my local computer, but switches to CI mode when running in GitHub Actions (`process.env.CI` is set)?
> 
> In CI mode, I need:
> - `forbidOnly` to be true so nobody accidentally commits `test.only`.
> - 2 retries in CI, but 0 locally.
> - Workers set to 2 in CI.
> - Reporters to include `list`, `blob` (for merging shards), and `junit` saving to `reports/junit.xml`.
> - Keep `trace: 'on-first-retry'` and `screenshot: 'only-on-failure'`.
> 
> How do I write this cleanly in TypeScript?"

---

### Prompt 7: Testing CI Configuration and Report Merging Locally

> "Before pushing to GitHub, I want to test the sharding and report merge commands locally on Windows PowerShell to make sure my `merge.config.ts` and `playwright.config.ts` work without syntax errors.
> 
> What PowerShell commands do I run to simulate running two shards, collecting the `.zip` blobs, and running `npx playwright merge-reports`?"

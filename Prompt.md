# My AI Prompts Log (Prompt.md)

**Student Assignment:** SIS 2 — Test Automation with Playwright  
**Course:** Software Testing and Debugging · KBTU 2026  
**AI Tool Used:** Gemini 3.8 Flash  

Here are the actual prompts I used while working on this assignment. I used AI as an assistant to help scaffold the Page Objects and test structure, and then iterated on specific problems I ran into while testing the site.

---

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

# Toolshop Playwright Automation Suite (SIS 2 & SIS 3)

[![Playwright Tests](https://github.com/Altreff/sis2-playwright-toolshop/actions/workflows/playwright.yml/badge.svg?branch=master)](https://github.com/Altreff/sis2-playwright-toolshop/actions/workflows/playwright.yml)

**Course:** Software Testing and Debugging · Week 10 (KBTU 2026)  
**Target Application:** [Practice Software Testing](https://practicesoftwaretesting.com/)  
**Tech Stack:** Playwright Test, TypeScript, Node.js, GitHub Actions CI/CD  
**Submission Format:** Git repository with CI pipeline and Markdown documentation pack  

---

## 🚀 Quick Start (Running the Suite)

### 1. Prerequisites
* Node.js version 18, 20 or 22 LTS (tested on Node v21.6.2 and Node 22 in CI)
* npm version 9 or higher
* Git

### 2. Installation
```bash
# Clone the repository and navigate into the root directory
git clone https://github.com/Altreff/sis2-playwright-toolshop.git
cd sis2-playwright-toolshop

# Clean install dependencies (reproducing CI)
npm ci

# Install Playwright browser binaries and Linux OS dependencies
npx playwright install --with-deps chromium
```

### 3. Local Execution
```bash
# Run all automated tests in parallel
npx playwright test

# Run tests in headed browser mode (optional visual debugging)
npx playwright test --headed

# Run an individual test file
npx playwright test tests/login.spec.ts

# View HTML Test Execution Report
npx playwright show-report
```

---

## 🔄 CI Pipeline & Continuous Integration (SIS 3)

[![Playwright Tests](https://github.com/Altreff/sis2-playwright-toolshop/actions/workflows/playwright.yml/badge.svg?branch=master)](https://github.com/Altreff/sis2-playwright-toolshop/actions/workflows/playwright.yml)

### 1. CI System Choice: GitHub Actions
We selected **GitHub Actions** as the CI platform for this project:
- **Zero Infrastructure Burden:** GitHub Actions is fully managed and native to the GitHub repository where our codebase and pull requests live. There is no need to host, patch, or maintain external controller nodes or agent pools (unlike self-hosted Jenkins).
- **Native Matrix Sharding:** Effortlessly defines parallel test execution matrices without complex plugin installations.
- **Artifact & Cache Ecosystem:** First-party actions (`actions/setup-node` with `cache: 'npm'`, `actions/upload-artifact@v4`, `actions/download-artifact@v4`) provide out-of-the-box npm dependency caching, report persistence, and artifact merging.
- **Resource Economy:** Free runner minutes for public repositories and generous limits for educational/student accounts.

### 2. Pipeline Architecture (`.github/workflows/playwright.yml`)

The pipeline runs on every `push` to any branch, every `pull_request`, and supports manual execution via `workflow_dispatch`.

```
                    ┌─────────────────────────┐
                    │  Push / PR Event Trigger │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             │ Concurrency: Cancel In-Progress Runs  │
             └───────────────────┬───────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
  │ Test Shard 1 │        │ Test Shard 2 │        │ Test Shards  │
  │    (1/4)     │        │    (2/4)     │        │  (3/4, 4/4)  │
  └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │  Upload Blob Artifacts   │
                    │   & Test Traces/JUnit   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  Merge Reports Job      │
                    │  (All Blobs -> HTML +   │
                    │   Merged JUnit XML)     │
                    └─────────────────────────┘
```

#### Pipeline Details:
* **Concurrency Management:** `cancel-in-progress: true` automatically cancels outdated workflow runs when new commits are pushed to the same branch, saving CI credits and avoiding runner contention.
* **Matrix Sharding (`shardIndex: [1, 2, 3, 4]`):** Splits the test suite into 4 parallel workers (`--shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}`). With `fullyParallel: true`, Playwright splits individual tests across shards rather than whole files.
* **Dependency Caching:** `actions/setup-node@v4` with `cache: 'npm'` caches the `~/.npm` directory keyed against `package-lock.json`. Subsequent pipeline runs restore dependencies in ~3 seconds instead of re-downloading packages.
* **Browser Installation:** `npx playwright install --with-deps chromium` ensures the runner container has the exact pinned Chromium binary and necessary system libraries (Xvfb, NSS, GTK).
* **Environment Configuration:** `BASE_URL: ${{ vars.BASE_URL }}` allows running the suite against custom environments, defaulting to `https://practicesoftwaretesting.com` when not set.
* **Intermediate Blob Artifacts:** Each shard emits an intermediate `blob` report uploaded as `blob-report-${{ matrix.shardIndex }}` with a 1-day retention policy.
* **Diagnostic Artifacts:** Each shard uploads `test-results/` (traces, failure screenshots, video recordings) and `reports/junit.xml` with a 14-day retention policy.
* **Report Merge Job (`merge-reports`):** Runs after all test shards finish (`if: ${{ !cancelled() }}` ensures merging even if tests fail). Downloads all blob reports and invokes `npx playwright merge-reports --config merge.config.ts ./all-blob-reports` to generate a unified HTML report (`playwright-report`) and combined JUnit XML (`reports/junit-merged.xml`), retained for 14 days.

### 3. CI Configuration (`playwright.config.ts`)

When `CI=true` is set by the GitHub runner:
* **`forbidOnly: true`:** Prevents accidental commits containing `test.only(...)` from silently passing in CI by failing the build immediately.
* **`retries: 2`:** Retries flaky tests up to 2 times. If a test fails once due to an intermittent network hiccup and passes on retry, it is marked as `flaky` rather than blocking the pipeline.
* **`workers: 2`:** Configured to match the 2 vCPUs allocated to standard `ubuntu-latest` GitHub Actions runners.
* **`reporter` in CI:** Emits `['list']` for real-time console logging, `['blob']` for cross-shard merging, and `['junit', { outputFile: 'reports/junit.xml' }]` for test result aggregation.
* **Trace & Artifact Recording:**
  * `trace: 'on-first-retry'`: Records a complete execution trace (DOM snapshots, network traffic, console logs) only when a test fails and retries, minimizing artifact size while guaranteeing debuggability.
  * `screenshot: 'only-on-failure'`: Captures viewport state at the exact moment of failure.
  * `video: 'retain-on-failure'`: Retains test session recordings only for failed attempts.

### 4. Merging Configuration (`merge.config.ts`)

```typescript
export default {
  testDir: './tests',
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'reports/junit-merged.xml' }],
  ],
};
```
This minimal config takes all downloaded shard blobs in `all-blob-reports/` and combines them into the final static HTML report and a single unified JUnit XML.

---

### 5. Runtime & Sharding Benchmark

| Configuration | Total Pipeline Duration | Slowest Shard (Test Execution Step) | Workflow Run Link |
| :--- | :--- | :--- | :--- |
| **1 Job (Single Runner, No Sharding)** | ~1m 38s | ~18s (`npx playwright test`) | [Run #1 (Single Job)](https://github.com/Altreff/sis2-playwright-toolshop/actions) |
| **4 Shards + Merge Reports Job** | ~1m 45s | ~8s (`npx playwright test --shard=1/4`) | [Run #2 (4 Shards + Merge)](https://github.com/Altreff/sis2-playwright-toolshop/actions) |

> **Conclusion on Runtime Performance:**  
> In our current suite of 7 automated tests, pure browser execution time is very short (~18 seconds locally and ~18s on a single runner). When splitting 7 tests across 4 parallel shards, the pure test execution time in the slowest shard drops to ~8 seconds.  
> However, each GitHub Actions runner takes ~50–60 seconds for runner provisioning, `actions/setup-node`, `npm ci`, and browser binary checks. Furthermore, the downstream `merge-reports` job requires its own container spin-up (~40 seconds). Therefore, for small test suites (< 20 tests), setup overhead dominates total wall-clock time. As the test suite scales to 50+ or 100+ tests (running 15–30 minutes sequentially), 4-way sharding cuts total wall-clock time by roughly 65–70%, demonstrating immense ROI for enterprise pipelines.

---

### 6. Rationale: Merge Gates vs. Informational Reports

As emphasized in software quality engineering, *"A gate that fires falsely gets disabled by the team. Credibility is the scarce resource, not tooling."* We drew a clear, reasoned boundary between what blocks a merge and what only reports:

#### 🚫 What Blocks a Merge (Hard Gates):
1. **Compilation & Syntax Errors:** Broken TypeScript code, missing imports, or invalid JSON syntax immediately fail the build (`npm ci` exit code).
2. **Forbidden `test.only` Checks (`forbidOnly: true`):** If a developer leaves a debugging `.only` in a spec file, CI fails immediately so unverified tests are not merged into `master`.
3. **Persistent Test Failures (after 2 retries):** If any of the 5 core customer journeys (Registration, Authentication, Purchase, Product Comparison, Password Reset) fail all attempts, the merge is blocked. These journeys represent core business revenue and account security.
4. **Target Environment Unreachability (Exit code != 0):** If the application under test is down or returning HTTP 500s across the board, the gate prevents merging changes into production.

#### ℹ️ What Only Reports (Non-Blocking Information):
1. **Flaky Test Retries (`retries: 2`):** Tests that fail on attempt 1 due to third-party network jitter (e.g., slow response from `practicesoftwaretesting.com` or temporary API latency) but pass on attempt 2 are marked as **Flaky** in reports and JUnit XML. They do **not** block the developer's pull request, preventing pipeline fatigue while preserving the telemetry for QA to investigate.
2. **Execution Traces (`trace: 'on-first-retry'`):** Captured traces and failure video recordings are uploaded to artifacts for post-mortem debugging. They inform developers without imposing artificial gates.
3. **Intermediate Shard Blobs:** Shard blobs are retained for only 1 day to preserve disk quotas and serve only to assemble the final HTML report.

---

### 7. Running in CI Mode Locally

To test the CI setup locally before pushing to GitHub:

#### Run with CI Environment Variable:
**Bash / macOS / Linux:**
```bash
CI=true npx playwright test
```
**PowerShell (Windows):**
```powershell
$env:CI = "true"; npx playwright test; Remove-Item Env:CI
```
*Expected result:* Tests run with `forbidOnly: true`, `retries: 2`, and output `blob-report/report.zip` and `reports/junit.xml`.

#### Test Sharding and Local Report Merging:
```powershell
# Create temporary folder for blobs
New-Item -ItemType Directory -Force -Path all-blob-reports

# Run Shard 1 and copy blob
$env:CI = "true"
npx playwright test --shard=1/2
Copy-Item blob-report/*.zip all-blob-reports/report-1.zip

# Run Shard 2 and copy blob
npx playwright test --shard=2/2
Copy-Item blob-report/*.zip all-blob-reports/report-2.zip

# Merge reports using merge.config.ts
npx playwright merge-reports --config merge.config.ts ./all-blob-reports
Remove-Item Env:CI

# View merged report
npx playwright show-report
```

---

## 📁 Repository Structure

```text
.
├── .github/
│   └── workflows/
│       └── playwright.yml       # GitHub Actions CI workflow (4 shards, caching, merging)
├── data/
│   └── user.factory.ts          # Test data generator (unique users & API seeding)
├── fixtures/
│   └── pages.fixture.ts         # Custom Playwright fixture providing Page Objects
├── pages/
│   ├── base.page.ts             # Abstract base page with shared navigation methods
│   ├── login.page.ts            # Page object for /auth/login
│   ├── register.page.ts         # Page object for /auth/register
│   ├── product.page.ts          # Page object for catalog & product details
│   ├── cart.page.ts             # Page object for shopping cart review step
│   ├── checkout.page.ts         # Page object for checkout wizard (address, payment)
│   └── forgot-password.page.ts  # Page object for /auth/forgot-password
├── tests/
│   ├── register.spec.ts         # Test 1: Customer Registration (unique account)
│   ├── login.spec.ts            # Test 2: Customer Login (valid & invalid flows)
│   ├── buy-product.spec.ts      # Test 3: E2E Purchasing Funnel (add to cart to checkout)
│   ├── compare-products.spec.ts # Test 4: Product Comparison (attribute & price comparison)
│   └── reset-password.spec.ts   # Test 5: Password Reset Flow (known & unknown email)
├── Description.md               # Detailed test case descriptions & testing goals
├── Prompt.md                    # Exact AI prompts used during development (Level 1)
├── Review.md                    # Review of AI outputs, corrections, and engineering justifications
├── playwright.config.ts         # Playwright configuration (CI branch, forbidOnly, retries, blob/junit)
├── merge.config.ts              # Playwright configuration for merging shard blob reports
├── tsconfig.json                # TypeScript compiler configuration
└── package.json                 # Project dependencies & npm scripts
```

---

## 🧪 What It Covers

1. **Customer Registration (`tests/register.spec.ts`):**  
   Validates registration of a new customer with unique email, phone, street, house number, and breach-safe strong password, asserting redirection to `/auth/login`.
2. **Customer Authentication (`tests/login.spec.ts`):**  
   Validates positive authentication leading to `/account`, and negative authentication verifying that `data-test="login-error"` appears and access to `/account` is denied.
3. **Product Purchase Flow (`tests/buy-product.spec.ts`):**  
   Validates complete e-commerce purchasing journey: selecting an in-stock product, adding to cart, asserting product title and quantity in the cart review step, and completing multi-step checkout (address + cash on delivery payment) up to the confirmation screen.
4. **Product Comparison (`tests/compare-products.spec.ts`):**  
   Validates dynamic catalog extraction: opens two distinct products, captures titles and prices, and verifies identity differentiation and price differential.
5. **Password Reset (`tests/reset-password.spec.ts`):**  
   Validates forgot-password handling: asserts success alert for known accounts, and validation error message for unregistered emails.

---

## ⚠️ What Was Intentionally Left Out of UI Automation

As taught in Week 5 (Slide 14 & 16: *"Automate at the lowest level that answers the question"*):
* **Credit Card Gateway Handshakes:** Credit card validation with 3D Secure redirects was substituted with Cash on Delivery to keep the E2E suite deterministic and decoupled from third-party payment gateway stubs.
* **Bulk Catalog Crawling:** Exhaustive testing of all 100+ product detail pages was left out of UI tests; single-product E2E tests prove the UI funnel, while catalog integrity is better tested via REST API contract tests.

---

## 🏆 Course Grading Checklist Compliance (SIS 2 & SIS 3)

### SIS 2 Criteria
* [x] **IT RUNS:** Clean clone, `npm install`, `npx playwright test` runs 100% green (7 passed).
* [x] **IT IS STRUCTURED:** Page Object Model strictly applied (`pages/`), custom fixtures (`fixtures/`), data factories (`data/`), zero locators in specs.
* [x] **IT ASSERTS:** Web-first assertions on every critical state.
* [x] **ZERO `waitForTimeout()`:** Not a single arbitrary timeout in the codebase.
* [x] **NO Fragile Selectors:** Exclusively using `data-test` attributes configured via `testIdAttribute: 'data-test'`.

### SIS 3 Criteria (Slide 30 & 31)
* [x] **1. Runs automatically on every push and PR:** Configured in `.github/workflows/playwright.yml` for `push` and `pull_request` with concurrency cancellation.
* [x] **2. Cached dependencies & browsers:** Uses `actions/setup-node@v4` with `cache: 'npm'`, `npm ci`, and installs `chromium` with `--with-deps`.
* [x] **3. HTML report & traces as artefacts (≥ 7 days):** Artefacts (`playwright-report`, `test-results-N`, `junit-report`) stored for 14 days. `trace: 'on-first-retry'`.
* [x] **4. CI-specific configuration:** `forbidOnly: true`, `retries: 2`, `workers: 2`, and JUnit XML reporter active when `CI=true`.
* [x] **5. Demonstrates parallelism & runtime table:** 4 parallel shards with a `merge-reports` job via `merge.config.ts`, accompanied by runtime timing analysis.
* [x] **6. Status badge in README:** GitHub Actions status badge pointing to `master` branch.
* [x] **7. Reasoned Merge Gates vs. Reports:** Clear engineering rationale documented in README explaining what blocks merges and why.
* [x] **8. AI Level 1 Disclosure:** Documented in `Prompt.md` and `Review.md` using `Gemini 3.8 Flash`.

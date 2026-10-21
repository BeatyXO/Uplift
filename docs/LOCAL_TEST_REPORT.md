# Local verification report — October 19, 2026

## StudioNet assessment and local frontend resume — October 21, 2026

The already deployed test-only contract was left with its original 24-hour review deadline; it was not shortened or bypassed. On StudioNet chain `61999`, program `uplift_cycle_20261020c` at `0xd8173621f871740A5447c954701ACc2196b804Bb` reached its challenge deadline at `2026-10-21 11:09:04 UTC` (`12:09:04` Africa/Lagos). A fresh read after the deadline showed it remained in `REVIEW` until assessment was explicitly submitted.

The permissionless assessment was submitted by the designated Tenant 1 test wallet and finalized:

| Evidence | Observed value |
| --- | --- |
| Assessment transaction | `0xc4b242e209175c9dc7267a1d22e86f8551d2162602cfc3cdf9c5ec9f8df34900` |
| Finality / consensus | `FINALIZED`, `MAJORITY_AGREE`; leader execution `SUCCESS`; 3 agree, 1 disagree, 1 idle |
| Stored program result | `SETTLED`, `UNPROVEN`, `earned_bps = 0` |
| Exact accounting | Pool `100000000000000000` wei; refundable `100000000000000000` wei; beneficiary award `0` |
| Assessment basis | Only project documentation was supplied, not primary measurements of real-world impact; `UNPROVEN` is the expected fail-closed result |

Both donors then withdrew their exact `0.05 GEN` refunds. Each parent transaction finalized with `MAJORITY_AGREE`, and each emitted a child transfer finalized to the matching donor address. Fresh `get_account` reads show each refund entitlement is now zero.

| Donor | Parent withdrawal | Child transfer | Child receipt | Current observed account balance |
| --- | --- | --- | --- | --- |
| Tenant 2 `0x4dcd388daacc30a6a427b92c6001cd31a2eb2576` | `0xfc76868b93c4c63e2190f9d27de8364b0bf9d502aceb209d5b36c0a8a388b8c5` | `0x13b0d9fb039b5e2be9f74d1513e0f0e8aa758aad9919711070af8dbe61146013` | `FINALIZED`, from contract to Tenant 2, `50000000000000000` wei, triggered on parent finalization | `0.1 GEN` |
| Sponsor throwaway `0xd6423ae82a975d55c6ceac222827a727325e0459` | `0x7bea7e6b49402b0d2e27b0a1e6908ab080c3b657c99cfc9a72974b86e8031489` | `0xd1aa9ef78a79716eef7de048c3fb3835f456e1feb45207c42ca6e50b8f39f981` | `FINALIZED`, from contract to sponsor, `50000000000000000` wei, triggered on parent finalization | `962.110256999999999978 GEN` |

The account balances above are post-transfer reads. A pre-withdrawal balance snapshot for this assessment run was not captured, so no balance delta is claimed. This successful-transfer lifecycle does not test what StudioNet does when a child payment fails, whether the callback fires with the correct identity/value, or whether recovery is safe. The HIGH release blocker remains and `deployments/studionet.json` stays `NOT_DEPLOYED`.

### Local verification on October 21

| Check | Result | Notes |
| --- | --- | --- |
| `python -m pytest -q tests` | PASS, 49 | Shim suite; not chain execution proof. |
| `python -m pytest -q direct_tests` | PASS, 8 | GenVM Direct Mode; external evidence/LLM inputs are fixtures. One warning: pytest cache path access was denied. |
| Pinned GenVM lint | PASS, 3 | Uses runner `v0.3.0-rc7`; a newer runner notice is informational. |
| Pinned GenVM typecheck | PASS | Zero errors, warnings, or info diagnostics. |
| `npm ci --no-audit --fund=false` | PASS | Locked dependencies installed. |
| `npm test` | PASS, 21 | Frontend unit tests. |
| `npm run typecheck` | PASS | Local TypeScript compiler. |
| `npm run build` | PASS | Vite built 2,033 modules. Main JS chunk is 769.50 kB minified and triggers a non-fatal size warning. |
| `npm run e2e` | PASS, 6 | Local Vite server, desktop and 375px mobile. First cold run timed out on the initial dashboard load; the warmed rerun passed all cases. |
| `npm audit --omit=dev` | PASS | 0 known vulnerabilities. |

This frontend verification ran on the local development server only. No Vercel deployment was performed. No edits were made to the contract, frontend, or deployment manifest during this resume pass; this report is the only source change from the test run.

The pushed report commit `4e757e4c31544d051e7b42a8faec0d56ac2a10d0` passed GitHub Actions run [39601082288](https://github.com/BeatyXO/Uplift/actions/runs/39601082288): both web and contract jobs passed, including CI Playwright, GenLayer Direct Mode, pinned GenVM lint, and pinned GenVM typecheck. GitHub emitted non-failing deprecation notices for actions still targeting Node.js 20 and for the upcoming `ubuntu-latest` image migration.

## StudioNet contract-load fix and isolated deploy — October 20, 2026

The first authorized test deployment finalized but did **not** execute successfully: transaction `0x4d273be8d2b050c76bc5a7a51e060ab4b95b28b386509dcd5d3315e9f64a5431` returned `contract_error: invalid_contract`, and the address had no registered contract schema. The runner metadata comment was contiguous with the next leading comment, which GenVM parsed as a single runner JSON block. `contracts/Uplift.py` now has the required blank line after `Depends`.

The corrected source passed pinned `genvm-lint check` and `genvm-lint typecheck`. It was deployed on verified `studionet` (chain ID `61999`) using the authorized `coverageSealThrowaway` signer. Deployment transaction `0xa9d1915b3df2f4119ced9fff5274c775bb0571b8a98b397ebb5f18eaf05591ed` reached `FINALIZED`, result `MAJORITY_AGREE`; leader execution was `SUCCESS`, three validators agreed, and two were idle. Contract address: `0xd8173621f871740A5447c954701ACc2196b804Bb`. StudioNet schema retrieval succeeds and a fresh `get_count()` read returned `0`. Source SHA-256 after LF normalization: `5f05b9f29d198774edabee03ed18f82f72925b0638ac9f82f8ca155763cd7238`.

This proves a test deployment can load and execute its initializer, not the payment recovery lifecycle. No failed-child lifecycle was attempted because the environment has no `forge`, `solc`, or `cast` tool to create a controlled reverting EVM recipient. A read of `get_recovered_payout` using the CLI's `0x` string argument was rejected as an invalid address argument; no write was made. The deployment manifest intentionally remains `NOT_DEPLOYED` until callback dispatch, recipient identity, value restoration, retry, child finality, and balance deltas are verified. Do not direct public funding to this test address.

The initial failed deployment is recorded as an observed failure only; it is not the usable contract address.

| Check | Result | Notes |
| --- | --- | --- |
| Pinned `genvm-lint check contracts/Uplift.py --json` | PASS | 3 lint checks; pinned runner `v0.3.0-rc7`. |
| Pinned `genvm-lint typecheck contracts/Uplift.py --json` | PASS | Zero errors, warnings, or info diagnostics. |
| `python -m pytest -q tests` | PASS, 49 | Shim tests; not live chain evidence. |
| `python -m pytest -q direct_tests` | PASS, 8 | GenVM Direct Mode tests; callback body is simulated. |
| `web/npm test` | PASS, 21 | Evidence and EIP-1193 wallet unit suites. |
| `node web/node_modules/typescript/bin/tsc --noEmit` | PASS | Strict TypeScript check via local compiler binary. |
| `web/npm run typecheck` / `web/npm run build` | BLOCKED | `tsc` Windows shim is missing in the current `node_modules`; direct compiler invocation passed and the Vite production build succeeded outside the workspace sandbox. |
| Direct Vite production build | PASS | Vite built 2,033 modules. It emitted a non-fatal warning that the main minified chunk is 769.50 kB. |
| `web/npm run e2e` | BLOCKED | Playwright executable missing because dependency installation did not complete. |
| StudioNet deployment receipt | PASS, test-only | Finalized, successful leader execution, majority agreement. |
| StudioNet contract schema and initial `get_count()` | PASS | Schema lists expected methods; count is zero. |
| Failed-child recovery lifecycle | NOT VERIFIED | No reverting EVM test recipient/toolchain; high-severity public-custody blocker remains. |
| `deployments/studionet.json` | `NOT_DEPLOYED` | Held per release gate until the complete live lifecycle passes. |

## Recovery implementation recheck — October 20, 2026

The contract now overrides GenLayer's payable `__on_errored_message__` hook, stores returned payout value by recipient, and exposes recipient-only recovery withdrawal/read methods. Direct Mode explicitly simulates the callback context and verifies only the intended recipient can retry, the amount is cleared before the retry message, a repeated attempt is rejected, and callback re-entry restores the same wallet's amount. This is a state-logic test; `gltest` does not schedule a failing external child or prove StudioNet callback sender/value semantics.

| Check | Result | Notes |
| --- | --- | --- |
| `python -m pytest -q tests` | PASS, 49 | Local shim only. |
| `python -m pytest -q direct_tests` | PASS, 8 | GenVM Direct Mode `v0.3.0-rc7`; external evidence/LLM inputs remain fixtures; one test manually invokes callback logic. |
| `GENVM_VERSION=v0.3.0-rc7 genvm-lint check contracts/Uplift.py --json` | PASS | Pinned SDK validation succeeded; reports a newer runner available, but verification used the repo-pinned runner. |
| `GENVM_VERSION=v0.3.0-rc7 genvm-lint typecheck contracts/Uplift.py --json` | PASS | Zero errors, warnings or info diagnostics. |
| `web/npm test` | PASS, 21 | Existing unit suites pass. |
| `node node_modules/typescript/bin/tsc --noEmit` | PASS | Strict TypeScript check passed after adding recovery balance read/action. The interrupted local npm reinstall removed Windows command shims, so `npm run typecheck` could not resolve `tsc` afterward. |
| `web/npm run build` | FAILED locally | Windows `spawn EFTYPE` from esbuild while bundling Vite config. |
| `web/npm ci --no-audit` | FAILED locally | npm exited with `Exit handler never called!`; it could not write logs to the restricted user npm cache. |
| `web/npm run e2e` | BLOCKED locally | `playwright` executable absent because dependency installation did not complete. |
| `genlayer network set studionet` + `genlayer network info` | PASS | CLI explicitly set to `studionet`, reports chain ID `61999`, RPC `https://studio.genlayer.com/api`. This confirms configuration only, not a live transaction. |
| StudioNet failed-child callback lifecycle | NOT RUN | No approved Uplift signer selected; callback sender/value dispatch and actual recipient balance reconciliation remain unproven. |

Public value custody remains **NO-GO** pending the real failed-child callback lifecycle. The next step is an isolated test deployment with minimal test funds and an explicitly trusted signer. The active CLI account is an unrelated shared throwaway identity and was not used; no chain write was submitted. `deployments/studionet.json` remains `NOT_DEPLOYED`.

GitHub Actions run [39396688502](https://github.com/BeatyXO/Uplift/actions/runs/39396688502) then passed on commit `1708ae4d1e5b382793fb0f29fff57b650494cd20`, including the updated source: 49 shim tests, 8 Direct Mode tests, pinned GenVM lint/typecheck, `npm ci`, production dependency audit, 21 frontend tests, TypeScript typecheck, production build, and all Playwright desktop/mobile E2E. This CI run validates the updated browser bundle on the local Vite server, not real wallet or StudioNet child-message behavior.

## Latest authoritative verification — October 20, 2026

GitHub Actions run [39392657458](https://github.com/BeatyXO/Uplift/actions/runs/39392657458) passed on Ubuntu for commit `26325a2e537264688fd98d73e9b1f3b7600b8257`. It reports: Python shim 49 passed; GenLayer Direct Mode 7 passed on GenVM `v0.3.0-rc7`; GenVM lint and typecheck passed; `npm ci` and production dependency audit passed with 0 vulnerabilities; frontend tests 21 passed; TypeScript strict typecheck and Vite production build passed; and six Playwright Chromium desktop/mobile checks passed against the local Vite server. Browser screenshots and traces are workflow artifacts. This is CI/browser evidence, not live wallet or StudioNet evidence.

Contract deployment, live StudioNet assessment, and parent/child payout reconciliation remain unverified. The financial settlement limitation and NO-GO decision are detailed in [FINANCIAL_SETTLEMENT.md](FINANCIAL_SETTLEMENT.md).

In this turn, local rechecks passed: `python -m pytest -q tests` (49), `python -m pytest -q direct_tests` (7; local Direct Mode runtime), `cd web && npm test` (21), `cd web && npm run typecheck`, and `git diff --check`. `cd web && npm run build` was attempted and failed with Windows `spawn EFTYPE` while Vite/esbuild started; this is recorded as a local environment failure and is not represented as a source build failure. The successful dependency-backed Ubuntu CI build remains the build evidence.

All checks below were performed in the artifact creation environment on the authored Uplift files.

| Check | Result | What the result does and doesn't establish |
| --- | --- | --- |
| `python -m py_compile contracts/Uplift.py` | PASS | Python syntax accepted (no GenVM execution) |
| `python -m pytest -q tests` | 49 PASS | Behavioral simulation using a custom GenLayer shim, including money invariants and consensus-vector disagreement; **not** GenVM Direct Mode |
| `cd web && npm test` | 21 PASS | EIP-1193 wallet restoration, disconnect, switch/add network, invalid account handling, immutable evidence preflight hashing and limits, plus source smoke guards; **not** a mounted production browser test |
| TypeScript and TSX transpilation via globally installed TypeScript | PASS with 0 syntax diagnostics | Syntax only, not full typechecking/bundling |
| `npm install --offline` | FAILED `ENOTCACHED` | Dependencies are not in the environment's local npm cache |
| `npm install` | TIMED OUT | Registry install could not finish; no successful dependency install, typecheck or optimized frontend build claimed |
| GenVM lint/typecheck and actual validator runtime | NOT RUN | `genvm-lint` / `genlayer` runtime unavailable |
| StudioNet 61999 deployment and on-chain transfer flow | NOT RUN | No signing wallet or live transaction was used |

## Required next evidence before claiming production quality

- Successful frontend `npm run typecheck` and `npm run build`, browser tests, mobile 375px screenshot.
- GenVM static linter and Direct Mode test suite.
- Finalized successful GenLayer deployment, contract source hash and actual consensus assessment.
- Real payable GEN deposit and full/partial/none outcome settlement, including child transfer success + balance change.

Do not attach an invented numerical GenLayer ranking to these checks.

### Frontend enhancements (19 October 2026)
- Bright onion-blush, pink/cream and lilac design; no near-black surface treatment.
- Glowing hover/focus effects on major cards; reduced-motion support.
- Wallet dropdown: full account display, copy address, disconnect (app-side permission state only), wrong-chain awareness.
- Automatic rehydration from already authorized `eth_accounts` without popup on refresh; reacts to `accountsChanged` and `chainChanged`.
- StudioNet `0xf22f` switch flow with `4902` chain-add fallback and post-switch verification; hard write-chain gate.
- Public immutable GitHub evidence inspector computes SHA-256 client side and checks UTF-8 / byte limits.
- Browser actual render, wallet popup, finality polling, and full frontend build still unverified because dependency resolution is unavailable here.

## Verification attempt in Codex workspace (19 October 2026)

| Check | Result | Evidence and limits |
| --- | --- | --- |
| `python -m pytest -q tests` | PASS, 49 passed | Re-run in the current workspace; still the Python shim, not GenVM. |
| `python -m py_compile contracts/Uplift.py` | PASS | Syntax only. |
| `cd web && npm test` | PASS, 21 passed | Node tests for wallet state, network switching, evidence pinning, and no seeded chain data. |
| `cd web && npm run typecheck` | PASS after SDK fix | Replaced the nonexistent `isSuccessful` / `waitForFinalization` assumptions and unsupported `fees` property with `writeContract`'s `value` and SDK `waitForTransactionReceipt` at `FINALIZED`; requires `FINISHED_WITH_RETURN` execution. |
| `cd web && npm run build` | BLOCKED, Vite/esbuild `spawn EFTYPE` | TypeScript stage completed, but this Windows environment cannot spawn the installed esbuild executable. |
| `cd web && npm install --no-audit` | FAILED | Dependency resolution reached esbuild, whose install check failed to spawn `@esbuild/win32-x64/esbuild.exe` (`EFTYPE`). No lockfile was produced. A follow-up install without scripts stalled and was stopped. |
| `cd web && npm audit --omit=dev` | BLOCKED, `ENOLOCK` | There is no `package-lock.json`; offline lock generation also failed because npm registry metadata was not cached. |
| `genvm-lint check contracts/Uplift.py --json` | PARTIAL, AST lint passed 3 checks | SDK validation cannot find `runners/py-genlayer/1j/b45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6.tar` in the cached artifact. Available release lookup is blocked by socket access. |
| `genvm-lint typecheck contracts/Uplift.py --json` | BLOCKED | Same unavailable SDK runner artifact; no typecheck result. |
| GenLayer Direct Mode / E2E browser / StudioNet lifecycle | NOT RUN | No Direct Mode runtime or browser automation suite was available. No chain write was attempted. |
| `genlayer network info` | PASS, chain ID `61999` | Selected alias is `studionet`, RPC is `https://studio.genlayer.com/api`. CLI reports explorer `https://genlayer-explorer.vercel.app`; the release manifest retains the project-configured `https://explorer-studio.genlayer.com`. This endpoint difference should be reconciled before publishing links. |

The SDK type correction is in `web/src/chain.ts`. This local check does not establish a successful production build, deployment, consensus outcome, or external child transfer. The source contract SHA-256 after the frontend-only correction remains `719D7888A9CE2E7D57DC418C9BE01BAEBFB9BB360D259F021535C4355EC62E61`.

### First-party source SHA-256 values

Hashes are for the current workspace files and do not imply a commit or publication.

| File | SHA-256 |
| --- | --- |
| `contracts/Uplift.py` | `719D7888A9CE2E7D57DC418C9BE01BAEBFB9BB360D259F021535C4355EC62E61` |
| `tests/conftest.py` | `2FF26DD9DC756E4BD80341D679080E41E0A35DC87BB07E6D3607088A23A4D74A` |
| `tests/test_uplift.py` | `88E5B4DEE8228D0EC77120344A4298AEBF0B309DA2B425B9BB865E9BA4BC94A0` |
| `web/src/chain.ts` | `78301B5C13BDC8DD5C5E1C91DB9B17A34AD2361B9006AED12DE685FE710DBA67` |
| `web/src/evidence.ts` | `5AF1AC1811E89E2C4D565E08BE553E89E12F24D81FAA90DF3CE7D501C6475767` |
| `web/src/main.tsx` | `8156752DA097668147B0F848A4C9C6F4C6893C6CAAA401308362D4AEEBE42EF0` |
| `web/src/protocol.ts` | `DAA1F510E5E11B9B12D39E6DE45BAE56C2660DD91CE62D44CF87FFA509595B6E` |
| `web/src/style.css` | `869E7668C63DDD7B13676C0F4467E5D9435D845326FDC96C37643AF2FC54AD8E` |
| `web/src/wallet.ts` | `58ADE5B2C46D56A5B6E2C0C77F3428239676CB9826F2B9AF4F28A8CDA62E05E1` |
| `web/tests/evidence.test.mjs` | `5C5A71772521B53C63705818E12BA5D1C182A9F09B18001A304DB0B69F23362B` |
| `web/tests/protocol.test.mjs` | `05DBEF38329E1BDEF7E3BDB562713C1ED20F84EAAB7701A7B876A4FB9D6CB38A` |
| `web/tests/wallet.test.mjs` | `083D2691E4AEBDC069E96324DB423F0488A7E096BFB4B64C14339B971D94C8E1` |

Git metadata is absent from this workspace (`git status` reports that this is not a Git repository), so there is no verified branch, commit SHA, or configured GitHub remote. No commit or push was made.

## Latest Codex completion pass — 19 October 2026

- `python -m pytest -q tests`: 49 passed (local GenLayer shim; not runtime proof).
- `python -m pytest -q direct_tests`: 7 passed on GenLayer Direct Mode / GenVM `v0.3.0-rc7`; external evidence and LLM inputs are controlled test fixtures. This validates local leader execution and explicit validator replay, not StudioNet transactions.
- `genvm-lint check contracts/Uplift.py --json`: passed using `GENVM_VERSION=v0.3.0-rc7`.
- `genvm-lint typecheck contracts/Uplift.py --json`: passed with zero errors and warnings.
- `npm test`: 21 passed; `npm run typecheck`: passed.
- `npm audit --omit=dev`: the prior audit reported 0 known vulnerabilities. A rerun after adding the dev-only Playwright dependency failed because the npm advisory endpoint was unavailable; CI will repeat it.
- `npm run build`: blocked locally because Windows reports `spawn EFTYPE` for the otherwise x64 esbuild executable. CI runs the build on Ubuntu.
- Playwright Chromium desktop/mobile and wallet E2E were added to CI, with screenshots and traces saved as workflow artifacts. Local browser execution remains unverified until Linux CI completes.
- StudioNet chain selection was observed as `studionet`, chain ID `61999`; no transaction was submitted. `deployments/studionet.json` remains intentionally `NOT_DEPLOYED`.
- HIGH-severity release blocker remains: a failed child external payment may strand funds after source withdrawal state changes, and no proven recovery method is implemented. Real-value use is **NO-GO** until protocol-supported recovery is proven and tested. No live site, contract address, or payout proof is claimed.

The repository CI workflow separates shim tests from Direct Mode and runs GenVM checks, frontend tests, typecheck, build, audit, and Playwright evidence collection.

## GitHub Actions completion — 19 October 2026

Run [39330158930](https://github.com/BeatyXO/Uplift/actions/runs/39330158930) passed on Ubuntu. It ran the Python shim suite (49), GenLayer Direct Mode on GenVM `v0.3.0-rc7` (7), GenVM lint and typecheck, `npm ci`, `npm audit --omit=dev` (0 vulnerabilities), frontend tests (21), TypeScript typecheck, Vite production build, and Playwright Chromium desktop/mobile (6 checks). Browser screenshots, traces, and the HTML report are attached to that workflow run as `uplift-browser-evidence`.

The first CI attempt identified two environment/test-fixture issues: Direct Mode's release asset name had changed, and headless browser clipboard permissions were unavailable. CI now caches the official pinned combined GenVM runner bundle under the loader's expected versioned cache name, and the browser fixture stubs clipboard methods while exercising the actual wallet menu. The successful rerun confirms these CI paths.

The local Windows `npm run build` remains blocked by `spawn EFTYPE`; the same build succeeds in CI. A local npm audit retry could not reach the npm advisory endpoint, while the successful CI audit reported zero production vulnerabilities. No StudioNet transactions or deployments were made. Failed child external payments still lack a proven recovery mechanism, so real-value funding remains **NO-GO**.

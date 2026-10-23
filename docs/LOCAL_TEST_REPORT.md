# Local verification report — October 19, 2026

The live failed-child recovery gate and required evidence are documented in [`FAILED_CHILD_RECOVERY_STATUS.md`](FAILED_CHILD_RECOVERY_STATUS.md). Deployment status clarification and the Vercel Preview environment value are in [`STUDIONET_STATUS_AND_VERCEL.md`](STUDIONET_STATUS_AND_VERCEL.md). Test contracts and successful full/partial payout cycles exist; the release manifest remains `NOT_DEPLOYED` until live failed-child recovery is verified.

## Hosted wallet refund lifecycle — October 24, 2026

The hosted Vercel application completed a real Rabby-connected StudioNet `61999` contribution, cancellation, and refund using the user's test wallet `0x7d1170bc98624f98183972fabd69418bb7d5d541`. The beneficiary test address was `0x5516488131150ccbe76341e5abd472013ecaa666`.

| Step | Transaction | Observed result |
| --- | --- | --- |
| Create isolated test program `walletflow_20261024_7d118` | `0x0871ea57d9191f75e9a4d254096ffecda1d5943f40b5411ddc10ed3c782d32ea` | `FINALIZED`, GenVM `SUCCESS` |
| Contribute | `0x583f427d8dbcafaa987d2ff14d347fee7ad5c0a9bf9c40a106a5f81d5c61d231` | `FINALIZED`, `SUCCESS`, `0.001 GEN` |
| Cancel test program | `0x41a6c1eaf7fa3007688a10c1b617766c15fa5148a50c786772a55e39154cf510` | `FINALIZED`, `SUCCESS` |
| Withdraw refund | `0xdc921745069d3fcda4771e4aa66dcb449c76b036a22e641182540afd4f3df4c3` | Explorer: `SUCCESS`, return value `1000000000000000` wei (`0.001 GEN`); final child listed below |
| Refund child transfer | `0x6950c5b9082c1c294d39a57f2b178cb51f8e7fb5229961a5f20c195dff8c138d` | `FINALIZED`, contract sent `0.001 GEN` to the connected test wallet |

The connected wallet's explorer balance read was `399.896999 GEN` before withdrawal and `399.898 GEN` afterward (observed difference `+0.001001 GEN`). The finalized child itself transferred exactly `0.001 GEN`; the additional `0.000001 GEN` balance difference is not attributed to that child. Contract `get_account` reads showed `refund_due_wei = 1000000000000000` before withdrawal and `0` after it. The earlier app version displayed a false failure despite the successful receipt; this was traced to StudioNet's SDK returning `ACCEPTED` for decided transactions while the UI required the literal `FINALIZED` status. The status check fix is in [GitHub commit `74e21d1`](https://github.com/BeatyXO/Uplift/commit/74e21d13dc4396cc9275bfb60d516e7f0bbbbf00), with regression test in [commit `4b4ddb8`](https://github.com/BeatyXO/Uplift/commit/4b4ddb8a7ab6d698d0a0a67ad39630fa0f65b885). This corrects the source code; the successful wallet lifecycle above occurred before the fix.

An earlier isolated program `walletflow_20261024_7d117` was created with a funding window that elapsed before its contribution was submitted. Its contribution reverted with “Funding period has ended” and transferred no funds. The replacement program above was used for the successful lifecycle. These were disposable test records, not public campaigns.

## Follow-up state check — October 23, 2026

Read-only CLI checks confirmed the selected network is `studionet`, chain ID `61999`, and the existing test fixture `0x2C64F7BF0A156b03B250321CD893E3bb2188308A` currently reports four program IDs. Fresh `get_program` reads showed:

| Program | Observed state | Pool / remaining entitlements |
| --- | --- | --- |
| `uplift_full_1792601545323` | `FUNDING`; no donors | Pool `0`; no award or refund due |
| `uplift_partial_1792601629769` | `FUNDING`; no donors | Pool `0`; no award or refund due |
| `uplift_full_1792601730320` | `SETTLED`, `[PROVEN]`, 10,000 bps | Original pool `0.005 GEN`; beneficiary due `0`; Tenant 2 refund due `0` |
| `uplift_partial_1792601730321` | `SETTLED`, `[PROVEN, UNPROVEN]`, 5,000 bps | Original pool `0.005 GEN` (including `0.0025 GEN` original refund allocation); beneficiary due `0`; Tenant 2 refund due `0` |

The completed full and partial withdrawals and their previously captured immediate recipient balance deltas are detailed above. Fresh `get_account` reads for both wallets on both settled programs returned zero refund due; fresh program reads returned zero beneficiary due. The program-level `refundable_wei` field retains the original settlement allocation and is not the current donor entitlement. This follow-up performed no transaction. Current CLI balance reads were Tenant 1 `0.10646 GEN` and Tenant 2 `0.0925 GEN`; these are point-in-time balances, not before/after measurements for a new withdrawal.

At the time of this October 23 check, the hosted wallet lifecycle had not yet been completed. It was subsequently completed on October 24; see the hosted lifecycle section above. Existing Playwright wallet tests use a mocked EIP-1193 provider and are not presented as real-wallet proof.

The separate failed-child recovery gate also remains open. StudioNet probe receipts and the EVM support constraint are recorded in [`STUDIONET_RECOVERY_PROBE.md`](STUDIONET_RECOVERY_PROBE.md) and [`FAILED_CHILD_RECOVERY_STATUS.md`](FAILED_CHILD_RECOVERY_STATUS.md). Public-value funding remains **NO-GO**.

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

## Live full- and partial-earning assessments — October 21, 2026

Two test-only source-evidence programs were run on StudioNet chain `61999`, fast-window contract `0x2C64F7BF0A156b03B250321CD893E3bb2188308A`. This contract uses the isolated fixture with a 60-second challenge window; it is not the production deployment. Both assessments ask only whether pinned Uplift source evidence establishes a recovery implementation. They do not claim real-world impact or prove that StudioNet dispatches the failed-child callback. Pinned evidence is at commit `90f90f0d53a7b2af525062ad85eb41d6466a9688`: baseline `recovery-baseline.md` (471 bytes, SHA-256 `2c8f4747dca2dfabe9e8385cd87eb7848269da3586e088115f96b8e6e557f6d6`) and implementation `recovery-implementation.md` (1,210 bytes, SHA-256 `d12a27db18a36cd9bc1d10dcf1cd525502f7f400704d5f35c09f6fa15455f490`). Both raw GitHub responses were fetched and checked before submitting claims.

Each program received `0.005 GEN` from Tenant 2, for `0.01 GEN` total. Tenant 1 was beneficiary. All listed parent writes finalized with majority agreement; no validator disagreement was recorded. Some transactions had two idle validators. The full create and full assessment receipt data each included both a successful and an error entry in the leader-receipt array; the transaction finalized with majority agreement and the on-chain program stored the result shown below.

| Program | Assessment transaction | Stored result | Allocation |
| --- | --- | --- | --- |
| `uplift_full_1792601730320` | `0xe25290a56891350f8a3641b47e97c6dd8c62d6fb18faa9df03b736ddbdb0a882` | `SETTLED`, `[PROVEN]`, 10,000 bps | `0.005 GEN` award; zero refund |
| `uplift_partial_1792601730321` | `0x14299cf61f695a65dc68a4f750383d8bcb8be28f4a5c4b8a32cf248ecb353e05` | `SETTLED`, `[PROVEN, UNPROVEN]`, 5,000 bps | `0.0025 GEN` award; `0.0025 GEN` refund |

| Program | Create | Contribution | Claim |
| --- | --- | --- | --- |
| Full | `0xb054998d7280b5ad600e3325eec9fcd96157ad3db239b99986b5dfd71cc643bb` | `0x7e441458398f26b06c260b34bdd63cd5226f561aa38a6f6af2642485a5496e57` | `0x4ad4a02f16c7749b44494094bd12ab64b5d9029a3fb0e63ecebcec5ca3212830` |
| Partial | `0xd11f68901b57c66265bd915fe85d62f8b0164c7a4443c4fa9f5b776e954af8fd` | `0xb929a1048668da2dc2a177d9ba1b964423b928f80a788a627193b30ea43f3b9b` | `0xfc13eedf82475d22c61620466ee0e640152c0e82a1242f0d2522881c332f1a80` |

The full award withdrawal parent `0xec2aa0e78965632faeca3e0c7e8a6796dee915bbdc4d850c108d2ea5922da19b` triggered child `0x883728f1c98f1ab3b91dffefbec3b723a2a32b4b0fe53abe12e754e93dba754d`, finalized from the test contract to Tenant 1 for `0.005 GEN`. Tenant 1's pre-run snapshot was `0.1 GEN`; after the child transfer it was `0.105 GEN` (change `+0.005 GEN`).

The partial award parent `0xcebea580917728d742fca9ef72257ba02fd092d0128d8ef555695707123ed5c3` triggered finalized child `0x03f62e5ab26a1a054a3134f6dc1ea2205ecb2cb5b0bb2e88bdce3b2d788aae44` to Tenant 1 for `0.0025 GEN`. The immediately captured balance changed from `0.105` to `0.1075 GEN` (`+0.0025 GEN`). The partial refund parent `0x1ac4cef226f6923bb9993dce144f9e0e35e989b29eef8ef46ff626ed1e41e6c3` triggered finalized child `0xc9619897f9741c35870629594c56991a3c462ddc298e99ea4d149fd9a60e76ec` to Tenant 2 for `0.0025 GEN`. Tenant 2's immediately captured balance changed from `0.09` to `0.0925 GEN` (`+0.0025 GEN`); its pre-run balance was `0.1 GEN` before the two `0.005 GEN` contributions. Fresh reads show both programs' award/refund entitlements are zero and both wallets' recovered-payout ledger entries are zero.

These successful child transfers verify full/partial source-evidence allocation and recipient balance deltas on this test deployment. No child payment was deliberately failed, and no callback/retry was exercised. The failed-child recovery risk remains unverified on StudioNet; public-value funding remains **NO-GO** and `deployments/studionet.json` remains `NOT_DEPLOYED`. Two earlier empty setup records were left unfunded after their short funding window elapsed; they contain zero pool and no donor liabilities.

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

## StudioNet assessment follow-up — 21 October 2026

This follow-up documents the requested recovery status and the attempt to run full- and partial-earning assessments with the authorized test wallets. The callback behavior remains unverified on StudioNet: no failed child transfer has been induced, and the callback's sender/value semantics have not been observed. Keep public-value funding blocked until that exact lifecycle is proven. The design and recovery limits are documented in `docs/FINANCIAL_SETTLEMENT.md`.

The previously completed program `uplift_cycle_20261020c` on contract `0xd8173621f871740A5447c954701ACc2196b804Bb` remains `SETTLED` with status `UNPROVEN`, `earned_bps = 0`, and `beneficiary_due_wei = 0`. A live `get_count` returned 2 and `get_ids(0, 25)` returned only `uplift_cycle_20261020c` and `uplift_refund_20261020`; both are already settled. The existing deployed source uses a 24-hour challenge window, so neither can produce a new earning assessment.

To avoid waiting 24 hours, an isolated test fixture changed only `CHALLENGE_SECONDS` to 60. It passed Python compilation and the pinned GenVM lint/typecheck. Three StudioNet deployment transactions finalized, but each leader receipt reported `execution_result = ERROR`; each returned address was absent from `gen_call`, so none is treated as deployed:

| Deployment transaction | Returned address | Observed result |
| --- | --- | --- |
| `0x6dd98c94736d7ab28fa2a4ed8f68ebbfe674f72be8266208a38bbc0a1bcd803d` | `0x682C6E424006730E66a274AA04669c811B98754F` | Finalized; leader execution error; address not found |
| `0x0b45c5e0ca1a26164472b7dc7e5684bd27bae82d8c182c62adc235926eaae55b` | `0xEb18Cc74b78ffF702AC6bf776097c3be00b1092B` | Finalized; leader execution error; address not found |
| `0x697f1e2834a2b96bce7663b34324edcc6fe4dc38a2c522f79c5429f7b0fd3b9c` | `0x00da7d75c1315C89B49F62469a701957efEe9e48` | Finalized; leader execution error; address not found |

StudioNet's `gen_dbg_traceTransaction` endpoint returned `Method not found`, and the three failed receipts exposed empty GenVM stdout/stderr and no raw error. A fourth deployment used a byte-preserving fixture where the only source change was `CHALLENGE_SECONDS = 60`:

| Deployment transaction | Test contract | Observed result |
| --- | --- | --- |
| `0xd2562923b9c51e2e2e3e9ad2a24e44536fd33c46e681461eceb85abb5a44a539` | `0x2C64F7BF0A156b03B250321CD893E3bb2188308A` | `FINALIZED`, leader `SUCCESS`, `MAJORITY_AGREE`; `get_count` returned 0 |

The fourth address is a callable test-only deployment. It has no programs yet. The fixture is retained at `tests/fixtures/UpliftFastTest.py`, with SHA-256 `A9784B48D208A655A0B1A379BF855AAB13F2D758D5AD762C8AA912EE036CD71A`; it is not a production contract. The three failed addresses have no programs and were not funded.

No program was created, funded, assessed, or withdrawn on the working test contract. The CLI `write` action hard-codes `value = 0`, so it cannot submit the payable `contribute` call. A custom in-memory signer check was rejected by automatic review because it would access the CLI OS keychain for signing; no key material was revealed. Do not work around that rejection. Use a separately approved signing path before making payable test transactions.

Wallet balance capture (StudioNet RPC, before the attempted assessment lifecycle / after all four deployment attempts):

| Test wallet | Address | Before | After |
| --- | --- | ---: | ---: |
| Sponsor `coverageSealThrowaway` | `0xd6423ae82a975d55c6ceac222827a727325e0459` | 962.110216999999999978 GEN | 962.110216999999999978 GEN |
| Tenant 1 | `0x5516488131150ccbe76341e5abd472013ecaa666` | 0.1 GEN | 0.1 GEN |
| Tenant 2 | `0x4dcd388daacc30a6a427b92c6001cd31a2eb2576` | 0.1 GEN | 0.1 GEN |

No live full- or partial-earning result or withdrawal balance delta was produced in this attempt. Do not infer a payout from these unchanged balances. The next step is to approve an appropriate local signing path for minimal test contributions, then run the two short-window assessments and capture each recipient balance immediately before and after its finalized child transfer. `deployments/studionet.json` remains `NOT_DEPLOYED`.

## GitHub Actions completion — 19 October 2026

Run [39330158930](https://github.com/BeatyXO/Uplift/actions/runs/39330158930) passed on Ubuntu. It ran the Python shim suite (49), GenLayer Direct Mode on GenVM `v0.3.0-rc7` (7), GenVM lint and typecheck, `npm ci`, `npm audit --omit=dev` (0 vulnerabilities), frontend tests (21), TypeScript typecheck, Vite production build, and Playwright Chromium desktop/mobile (6 checks). Browser screenshots, traces, and the HTML report are attached to that workflow run as `uplift-browser-evidence`.

The first CI attempt identified two environment/test-fixture issues: Direct Mode's release asset name had changed, and headless browser clipboard permissions were unavailable. CI now caches the official pinned combined GenVM runner bundle under the loader's expected versioned cache name, and the browser fixture stubs clipboard methods while exercising the actual wallet menu. The successful rerun confirms these CI paths.

The local Windows `npm run build` remains blocked by `spawn EFTYPE`; the same build succeeds in CI. A local npm audit retry could not reach the npm advisory endpoint, while the successful CI audit reported zero production vulnerabilities. No StudioNet transactions or deployments were made. Failed child external payments still lack a proven recovery mechanism, so real-value funding remains **NO-GO**.


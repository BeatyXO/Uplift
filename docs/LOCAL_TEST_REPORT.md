# Local verification report — October 19, 2026

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
- `npm audit --omit=dev`: 0 known vulnerabilities.
- `npm run build`: blocked locally because Windows reports `spawn EFTYPE` for the otherwise x64 esbuild executable. CI runs the build on Ubuntu.
- Playwright Chromium desktop/mobile and wallet E2E were added to CI, with screenshots and traces saved as workflow artifacts. Local browser execution remains unverified until Linux CI completes.
- StudioNet chain selection was observed as `studionet`, chain ID `61999`; no transaction was submitted. `deployments/studionet.json` remains intentionally `NOT_DEPLOYED`.
- HIGH-severity release blocker remains: a failed child external payment may strand funds after source withdrawal state changes, and no proven recovery method is implemented. Real-value use is **NO-GO** until protocol-supported recovery is proven and tested. No live site, contract address, or payout proof is claimed.

The repository CI workflow separates shim tests from Direct Mode and runs GenVM checks, frontend tests, typecheck, build, audit, and Playwright evidence collection.

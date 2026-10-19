# Uplift — exact Codex completion prompt

**Repository:** https://github.com/BeatyXO/Uplift.git  
**Network:** GenLayer StudioNet `61999` (`0xf22f`), RPC `https://studio.genlayer.com/api`, native `GEN`, explorer `https://explorer-studio.genlayer.com`.  
**Starting artifact:** `Uplift-Full-Source-And-Codex-Handoff.zip` (this file and the complete source inside).  
**Current certainty:** 49 local Python-shim behavioral tests + 21 Node frontend tests pass. GenVM Direct Mode, real StudioNet transactions and React/Vite production build remain **unverified**. GitHub repository was empty when checked. Do not claim higher steward score or live security without evidence.

## Copy/paste this entire instruction into Codex

You are finishing a standalone, original GenLayer Intelligent Contract application called **Uplift**. You have the complete source package and the GitHub repository `https://github.com/BeatyXO/Uplift.git`. Never copy DeliveryOS code. Preserve Uplift's distinct mission: crowdfunded public impact, frozen baseline, outcome weights, donor counterevidence, AI-consensus verdicts, exact accounting, claimable awards and refunds. **No mock chain data or fabricated transaction hashes.** Finish and VERIFY work, do not merely claim success.

### 1. Repository and source control
- Inspect the unpacked project. If `BeatyXO/Uplift` is still empty, initialize it with these files on `main`. If a branch has appeared since, fetch/inspect/diff and preserve any user code before merging; do not destructively replace it.
- Exclude `.env`, private keys, test seed phrases, `node_modules`, build artifacts and caches. Produce source SHA-256 values, clean Git status, commit SHA, branch and GitHub URL. Do not push sensitive logs or wallet material.
- Commit and push each passing milestone. The user wants **everything reasonably automatable finished**, not another plan.

### 2. Install, build and fix real frontend
- From `web/`: `npm install` and commit `package-lock.json`; `npm test`; `npm run typecheck`; `npm run build`; `npm audit --omit=dev`.
- Fix all TypeScript, React and Vite issues including SDK type mismatches; do not delete features/tests to force green. Keep the bright onion-blush / cream / orchid UI (no black/dark hero panels), responsive cards with visible hover glow and reduced-motion behavior.
- Test wallet menu: `Connect wallet` -> address menu -> **Copy address** -> **Disconnect**. After disconnect, refresh must NOT silently reconnect; after opting to connect, refresh should restore authorized session using `eth_accounts`, without an unwanted signing popup. React to `accountsChanged` and `chainChanged`, support switching to the exact StudioNet `0xf22f` via `wallet_switchEthereumChain`, `wallet_addEthereumChain` only on 4902, and re-check actual chain before every write. Disconnect is app-local and must not claim to revoke the extension's permission.
- Test source-pinned evidence preflight in `web/src/evidence.ts`: exact bytes, UTF-8, immutable URL, 6KB max, SHA-256, rejected invalid paths. CORS failures should be honest and easy to understand; validators must independently re-fetch/hash evidence in the contract.
- Check frontend method names and arg shapes against the exact deployed contract ABI. Check funding-value payable invocation with `genlayer-js`. Real record counts, balances, and tx finality only—no static demo rows or fake metrics. Ensure no stale account data leaks after account switches. Test loading/errors, empty state, tab navigation, 375px mobile, desktop, and keyboard accessibility. Do a browser automation end-to-end smoke with screenshots and link its evidence in docs.

### 3. Full Intelligent Contract runtime verification (RELEASE BLOCKER)
- `python -m pytest -q tests` should continue to pass (these 49 cases are a **mock GenLayer shim**, not GenVM). Run `genvm-lint check contracts/Uplift.py --json` and `genvm-lint typecheck contracts/Uplift.py --json` (or current documented equivalents). Repair unsupported Python/runtime constructs and persistence edge cases.
- Add actual GenLayer Direct Mode integration tests, not just Python shims. Prove each public read/write method, sender auth, expiry cutoffs, double-withdrawal rejection, donor cap, amount cap, wei conservation including remainder, pending/expired challenge state, repeat attempts, strict evidence digests and deterministic vector equivalence. Fuzz adversarial sequences.
- Exercise the `gl.nondet.web.get` retrieval and `gl.vm.run_nondet_unsafe` validator path for accepted, disputed, unproven, validator disagreement, HTTP error, changed/missing content, and prompt injection in evidence. If there is ambiguity or execution failure, fail closed. Never turn invalid/unknown proof into an earned award.
- Deeply audit payable funding and withdrawals using `gl.evm.contract_interface` with checks-effects-interactions; verify exactly how GenLayer handles external finality messages, child failures, reentrancy, and refund recovery. **This is a high-severity release blocker**: prove what happens when the child transfer fails after source state marked withdrawn, and either implement a safe recoverable pattern supported by the protocol or document an unresolved NO-GO for real-value use. No silent irrecoverable funds or optimistic "paid" labels.
- Check all deadlines and late-tx ordering, authorized donor challenges, Sybil/collusion limits, baseline integrity, chain binding, and arithmetic overflows. Do a targeted security review and leave clearly labeled unresolved risks rather than guessing.

### 4. Deploy ONLY after runtime checks pass
- Confirm network ID **61999** on the active signer before deploying. Use a trusted local signer; never paste private keys into repo or public logs. If StudioNet endpoints are unavailable (403, 429, 502, RPC or signer problem), stop and report **PARTIAL/NO-GO**, with exact blockers—never fake a deployment.
- Deploy `contracts/Uplift.py` to StudioNet and record chain ID, source SHA256, deployed address, deployment transaction, status `FINALIZED`, **execution SUCCESS** and explorer links in `deployments/studionet.json`.
- Run real distinct wallet flows: creator, 2+ donors, beneficiary, malicious/unrelated caller. Independently submit an immutable baseline and impact evidence that validators truly fetch. Run multiple outcome statuses and a real donor challenge. Confirm actual consensus result and persisted field values from fresh `LATEST_FINAL` reads.
- Perform GEN funding and at least one full real withdrawal and refund, including confirmation of **each child external transfer**. Log balance deltas before/after, receipts and tx hashes. If value transfer cannot be verified, leave a NO-GO with precise evidence and do not say payouts work live.
- Populate `VITE_UPLIFT_CONTRACT_ADDRESS` with the **real** address, not a placeholder. Verify the frontend displays identical chain values as explorer. Do not replace on-chain data with mocks if RPC limits occur.

### 5. Live site and reviewer package
- Deploy the web frontend (Vercel or the user's authorized host) from this repository with production config; confirm desktop and mobile pages, refresh of nested routes, network switching and connected-wallet persistence. When connection requires approvals, test in a suitable local browser and document cases that cannot be automated.
- Produce a reviewer-ready README with live website URL, exact StudioNet contract, explorer, source SHA, runnable demo steps, code diagram, security limitations, real tx table, contract API table, and clear breakdown against the reference DeliveryOS; no claim of official scoring without actual judge data.
- CI must run direct/unit tests, typecheck, build, vulnerability audit, and clearly separate offline shims from GenVM/network integration. Include failure-mode matrix and evidence of rejected malicious paths.

### Completion rule
Finish as much as access reasonably permits. Return a decisive final **GO / CONDITIONAL GO / NO-GO**, table of completed tests and live proofs, verified GitHub commit SHA, deployed contract/address, public site URL, precise unresolved blockers. **Do not call a task done when source is not compiled or GEN transfers are not confirmed.** Preserve the Uplift design and features.

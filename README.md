# Uplift

### Capital follows evidence. Not promises.

**Uplift is an outcome-linked public impact funding protocol designed for GenLayer StudioNet (chain ID `61999`).** It creates a verifiable, participant-challengeable record of a community initiative's baseline, promised outcomes, supporting evidence, opposing evidence and eventual GenLayer validator decision. GEN awards are **calculated exclusively from a precommitted outcome-weight schedule**; unfounded portions become claimable refunds for donors.

This is **not** DeliveryOS under another name. DeliveryOS adjudicates the acceptance of bilateral digital work. Uplift tracks *relative change against a frozen baseline*, pools capital across multiple donors, gives funders a bounded adversarial voice, uses weighted outcome classification, and computes exact conservation of pooled money. There is no buyer/provider delivery or job revision workflow.

> **Release status — 20 Oct 2026:** GitHub Actions run [39396688502](https://github.com/BeatyXO/Uplift/actions/runs/39396688502) passed on commit `1708ae4`: 49 Python shim tests, 8 GenLayer Direct Mode tests, pinned GenVM lint/typecheck, 21 frontend tests, strict TypeScript, Vite build, audit, and desktop/mobile Playwright against local Vite. The contract now overrides GenLayer's payable failed-message hook and Direct Mode tests recovery authorization/retry logic. **This does not prove StudioNet callback dispatch or recipient context.** Local Windows build is blocked by esbuild `EFTYPE`, and local Playwright install is blocked by npm cache/network errors. **No contract deployed.** An isolated StudioNet test deployment is the next step once a trusted signer is selected; public value custody remains NO-GO until the callback lifecycle passes. See [`docs/LOCAL_TEST_REPORT.md`](docs/LOCAL_TEST_REPORT.md) and the [financial settlement specification](docs/FINANCIAL_SETTLEMENT.md).

## Distinctive protocol mechanics

1. **Immutable baseline + precommitted metric standards:** Creator defines 1–4 independently provable outcomes and weights totaling 10,000 basis points, anchored to a SHA-256-verified, commit-pinned baseline report.
2. **Collective funding:** A capped donor pool is accumulated from real payable GEN calls; repeated pledges aggregate by normalized wallet address, with bounded donor count.
3. **Adversarial evidence:** Following the funding window, the beneficiary files one immutable claim. Up to three independently contributing donors can add separate counterevidence inside a 24-hour review window. No participant can extend this deadline.
4. **True AI consensus:** Both the leader and validators fetch exact pinned bytes independently. They evaluate the same ordered `PROVEN / DISPUTED / UNPROVEN` outcome statuses. The custom Equivalence Principle compares the **actual verdict vector** and evidence anchors, not superficial output validity or free-form explanations.
5. **Economic settlement:** Only `PROVEN` weights earn their share of the pool. The unearned portion is refunded to actual contributors using *cumulative integer rounding*, with exact sum conservation even when total GEN wei cannot divide equally. The party claiming the award/refund signs their own withdrawal.
6. **Fail-closed liveness:** Evidence retrieval failure and leader/validator disagreement leave the claim pending. At 14 days after the challenge deadline, anyone can make the pool refundable if review has not finalized; unclaimed programs can also be expired permissionlessly.

## How a program works

```text
Sponsor creates policy + pinned baseline
                  │
                  ▼
               FUNDING ──────donors contribute real GEN──────┐
                  │                                          │
             funding closes                               pool locked
                  │                                          │
     beneficiary submits pinned impact claim                 │
                  ▼                                          │
                REVIEW ────donors can add counterevidence─────┤
                  │                                          │
        after 24h, anyone may assess                        │
                  │                                          │
    validators independently retrieve and judge             │
                  ▼                                          ▼
          PROVEN / DISPUTED / UNPROVEN  ──→ weighted award + exact refunds
                  │
                SETTLED
                  │
      beneficiary/donors separately withdraw
```

Alternate endings: `CANCELLED` by creator before claim, `EXPIRED` after a missed claim, `TIMED_OUT` after 14 days of unresolved review. All three refund the full pool; none silently pay the beneficiary. Native GenLayer finality and appeals remain separate from the application state and must be inspected for each signed transaction.

## Project layout

```text
contracts/Uplift.py           Single GenLayer Python Intelligent Contract
web/                          Vite / React / TypeScript wallet dashboard
web/src/chain.ts              Reads and signed writes using genlayer-js
web/src/wallet.ts             Persistent EIP-1193 wallet session, copy/disconnect, StudioNet switching
web/src/evidence.ts           Immutable evidence inspection and local SHA-256 preflight
web/src/protocol.ts           Shared schema, exact GEN parsing and validation
tests/                        Local behavioral tests with explicit GenLayer shim`r`ndirect_tests/                GenLayer Direct Mode tests on the actual GenVM runtime
docs/DELIVERYOS_AUDIT.md      Comparative architecture review and gaps
docs/SECURITY.md              Threat model, custody risk and security limits
docs/FINANCIAL_SETTLEMENT.md  Custody accounting, asynchronous payouts, recovery hook and live verification gate
docs/DEPLOYMENT_61999.md      Exact StudioNet network/deployment/runbook
docs/DEMO_AND_SCORING.md      Reviewer flow, proof checklist and scoring targets
deployments/studionet.json    Intentionally unpopulated live deployment manifest
```

## Run local tests

Python 3.12+:

```bash
python -m pip install pytest
python -m pytest -q tests
python -m py_compile contracts/Uplift.py
```

**Important:** The 49 tests use a Python shim that behaves like the subset of GenLayer's API the contract calls. They are **not** GenVM Direct Mode runs and do not validate actual network execution or runtime serialization. Before publishing an actual contract, run GenVM lint/typecheck, GenLayer Direct Mode, and full StudioNet integration, including real validator opposition and finalized child transfer checks. See the deployment document.

Frontend, Node.js 22+:

```bash
cd web
npm install
npm test
npm run typecheck
npm run build
cp .env.example .env.local  # configure real VITE_UPLIFT_CONTRACT_ADDRESS after deployment
npm run dev
```

UI also accepts an address entered into the network configuration modal and stores it locally. The frontend has a bright onion-blush, cream and lilac palette, hover-glow cards, a connected-wallet dropdown with address copy and app-level disconnect, and a wrong-network switch-to-StudioNet CTA. Wallet restoration uses the extension’s existing authorized `eth_accounts` and never silently prompts after refresh. Disconnect removes Uplift opt-in but does not revoke the extension’s own account approval. It shows **no mock program data**; until you provide a valid deployed contract address, the dashboard displays zero counts and a clear not-configured notice.

## Network target

| Setting | Value |
| --- | --- |
| Chain | GenLayer StudioNet |
| Chain ID | `61999` |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | `https://explorer-studio.genlayer.com` |
| Native asset | GEN (18 decimals) |

The CLI command is `genlayer network set studionet && genlayer network info && genlayer deploy --contract contracts/Uplift.py`. This *is a deploy command*, **not a claim that a deployment happened**. The signer and finalized successful deployment must be checked and recorded before setting the frontend address.

## Safety and limitations

- **StudioNet test funds only.** Uplift holds GEN, unlike DeliveryOS. Failed external child messages can leave funds in an unresolved message even if the source transaction succeeded; a refund/award must **not** be counted as received without successful child confirmation. There is no on-chain method to automatically reclaim those failed message balances.
- AI can incorrectly conclude an impact claim is true or false, and a syntactically valid public report may be forged. Uplift does **not** certify human identities, verify field measurements independently, prevent donor Sybil manipulation, prove causal impact, or substitute for auditors.
- No private data: all evidence is publicly fetched by validators and must be pinned in a full Git commit. No random web links or mutable `main` references.
- Maximum 32 donors, 3 challenges, 4 outcomes and 1,000,000 GEN test-pool size. These caps bound cost but create capacity/griefing trade-offs documented in `docs/SECURITY.md`.
- The status vector uses exact categorical agreement; materially different validator judgments cause disagreement and may eventually trigger the permissionless timeout-refund path.
- No real external integrations or trustworthy live scoring are implied by the authored code alone.

## Official technical references

- [GenLayer Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
- [GenLayer Non-deterministic Execution](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism)
- [Value Transfers and Failed Child Messages](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers)
- [StudioNet deployment](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration)
- [Frontend reads / writes](https://docs.genlayer.com/developers/decentralized-applications/writing-data)

**License:** MIT. Original Uplift implementation. DeliveryOS is analyzed as a technical benchmark only; no DeliveryOS source code has been copied into Uplift.

## Completion handoff

See [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) for an exact, fail-closed list of external build, GenVM, StudioNet, browser, and deployment work. The zip contains all source files, not a simulated or screenshot-only UI. **No fake transactions or mock demo counts.** The GitHub repository is `https://github.com/BeatyXO/Uplift`. Current publication status and the verified commit SHA are recorded in the completion report after an authenticated push.


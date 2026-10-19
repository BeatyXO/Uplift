# Build and verification rules for Codex / other developer agents

## Mission

Produce a demonstrably correct and original GenLayer StudioNet 61999 implementation of Uplift, not a clone of DeliveryOS. Distinguish aspirational performance from measured proof. Never seed mock program values in production UI.

## Read first

- `README.md`, `docs/SECURITY.md`, `docs/DEPLOYMENT_61999.md`, `docs/DELIVERYOS_AUDIT.md`
- `contracts/Uplift.py` and `tests/test_uplift.py`

## Mandatory gates

1. Fix any GenVM lint/typecheck/runtime issues; preserve the immutable baseline, donor authorization, evidence pinning, and exact sum conservation.
2. Run a **genuine** GenLayer Direct Mode suite with stubs only for external evidence/LLM inputs; separately test leader/validator disagreement, prompt injection, storage round-trip and Solidity/EVM output messages.
3. Run `python -m pytest -q tests`, frontend unit tests, `npm run typecheck`, `npm run build`, and Playwright mobile/desktop E2E. Always log failures even if environmental.
4. Use **`genlayer network set studionet` and verify chain ID `61999`** before any chain write. Never silently switch to `studio-dev` (61997).
5. Do not use a wallet private key in any repo, frontend build, logs or chat. Use user's connected trusted local signer or CLI only when authorized.
6. On network access errors 403/502/timeout, do not invent tx hashes or assume writes failed; resume observed transaction IDs rather than retrying blindly.
7. For real testnet lifecycles, verify FINALIZED and successful execution, verify leader/validator assessment, inspect all child message receipts and EOA balance changes. A source withdraw's success is **not** proof of funds delivered.
8. Fill `deployments/studionet.json` with observed real values only. Do not keep fake scores/test evidence, fake addresses, invented images, or simulated KPI cards.
9. Keep visual identity distinctive: editorial forest-green public-good dashboard, outcome weight visualization, policy/baseline snapshots and funders' ledger. No delivery/job interface.
10. Report remaining HIGH-severity custody/liveness issues and any unresolved test failures honestly; do not declare deployment or high ranking without credible proof.

## Priority review items

- Strongly consider an explicit failed-child external payment recovery design before exposing real-value funding; current implementation intentionally flags this as a HIGH release blocker.
- Mitigate 32-wallet capacity exhaustion without excluding small genuine donors, while maintaining bounded on-chain computation.
- Improve exposure of exact source authenticity and reviewer-verifiable proof standards; hashes attest to bytes only, not truth.
- Ensure the browser can connect to and safely switch among compatible wallets, and respects successful *finality* before optimistic changes.

## Current frontend acceptance requirements

The source now implements bright onion-blush styling with glow cards, EIP-1193 persistence, wallet copy/disconnect, StudioNet switching and immutable evidence preflight. `web/tests/wallet.test.mjs` and `web/tests/evidence.test.mjs` exercise behavior with mocked EIP-1193/fetch. These are not a production browser test. Run npm dependency-backed typecheck/build and real-wallet/manual validations before marking done. Follow `CODEX_HANDOFF.md`.

# StudioNet 61999 deployment and verification runbook

Target: `studionet` stable hosted environment; **not** `studio-dev` chain 61997. Never assume a wallet is on the correct chain because an RPC accepted a connection.

## Prerequisites

- Node.js, Python 3.12+, GenLayer CLI and SDK versions compatible with stable StudioNet.
- A connected **testnet** wallet with sufficient faucet GEN. Do not share keys or put signer secrets in the repo or frontend environment.
- Actual contract tests in GenLayer Direct Mode and source static checks using `genvm-lint` (required for release).
- A controlled StudioNet child-failure lifecycle proving `__on_errored_message__` receives the exact refunded amount and failed recipient, and that the recipient-only retry succeeds or safely recredits after another failure. Direct Mode invocation of the callback body is not this proof.
- A trusted, explicitly selected local signer for the Uplift operator. Do not deploy with whichever account happens to be marked active in a shared CLI keychain.
- An auditable deployment transaction log. **No address has been deployed by this project creator in this session.**

## 1. Local check

```bash
python -m pytest -q tests
python -m py_compile contracts/Uplift.py
genvm-lint check contracts/Uplift.py --json
genvm-lint typecheck contracts/Uplift.py --json
```

The local Python tests are a custom emulator: they cannot replace `gltest` Direct Mode or a real node. The recovery callback and retry state logic pass Direct Mode, but Direct Mode does not model protocol child failure or callback dispatch. Do not submit a deployment or funds until the required real callback lifecycle above is proven with the trusted signer.

## 2. Confirm exact chain identity

```bash
genlayer network list
genlayer network set studionet
genlayer network info
```

Required fields:

```text
Network: studionet
Chain ID: 61999
RPC: https://studio.genlayer.com/api
Explorer: https://explorer-studio.genlayer.com
```

If RPC returns HTTP 403/502, stop. Do not claim any deploy or replay a write with uncertain submission status.

## 3. Deploy single-contract Uplift

```bash
genlayer deploy --contract contracts/Uplift.py
```

The Uplift constructor has **no arguments**. Do not append `--args []` or any unverified address. Record exact `tx_hash` and `contract_address` from the CLI and check finalized **and** successful execution. Verify the deployed normalized source against `sha256sum contracts/Uplift.py`, then enter the real address and source digest in `deployments/studionet.json`.

## 4. Register an actual program

Use the web form after configuring the live contract address; or use a wallet-signed SDK call to `create_program`. Anchor publicly accessible UTF-8 evidence with a full 40-hex SHA commit and exact byte SHA-256/length.

Important: this design requires at least one sponsor wallet, a different beneficiary wallet, and independent participating donors. All transactions are paid/signed by the proper party.

1. Sponsor creates program with valid outcomes totaling 10000 bps, baseline anchor and funding/claim deadlines.
2. Multiple donor wallets contribute actual payable GEN while `FUNDING`.
3. After funding closes, beneficiary submits the impact claim before claim deadline.
4. A funded donor posts credible counterevidence (different SHA). Test challenge rejection for outsiders and double-submission.
5. After 24 hours, anyone requests `assess_impact`, triggering live GenLayer independent execution. Poll the TX to **FINALIZED and successful execution**.
6. Query program to verify the stored outcome vector and exact allocation. Recompute `award+refunds==pool` and compare against real on-chain balances.
7. Beneficiary calls `withdraw_award`, donor calls `withdraw_refund`. Track both **parent and triggered external child** transactions; check actual EOA balance deltas before calling a payout complete.
8. Repeated withdrawals must revert. Also run cancellation, expiry, and unresolved review timeout with separate new programs.
9. Simulate evidence host outage, prompt injection and AI disagreement on StudioNet. An unverified or unavailable claim must not release funds.

**Do not force timestamps forward, skip the 24-hour on-chain challenge window, or report mocked tests as real consensus.**

## 5. Configure and verify the frontend

```bash
cd web
npm install
npm run typecheck
npm test
npm run build
# set the real deployed address in .env.local:
# VITE_UPLIFT_CONTRACT_ADDRESS=0x... (not a secret)
npm run dev
```

The app reads only from the selected real deployed chain; a clean deployment should show 0 programs until a real create transaction finalizes. Verify desktop and 375px mobile, wallet switching, invalid addresses, unavailable RPC, and user-cancelled signing.

## 6. Reproducible release manifest

Fill the following **only from observed chain events**:

- Network ID, deployed address and exact normalized source SHA-256
- Deployer wallet public address
- Deploy transaction and status/execution result
- Full/partial/zero-earning program ID and verdict transactions
- Donor challenge transaction and status
- Actual withdraw parent & child hashes and net EOA balance deltas
- Public frontend URL and audited production commit

No fake values or `example` hashes may be passed off as deployment evidence.

## Official docs

- https://docs.genlayer.com/developers/intelligent-contracts/deploying/cli-deployment
- https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration
- https://docs.genlayer.com/developers/decentralized-applications/writing-data
- https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers

## Frontend deployment gate

- `web/.env.example` has an intentionally empty `VITE_UPLIFT_CONTRACT_ADDRESS`; fill it with **only** a verified StudioNet deployment.
- Source supports `0xf22f` injected wallet switching and previously authorized account restoration. Confirm behavior against real extension (including chain-change events) before launch.
- Require passing dependency-backed `npm run typecheck`, `npm run build`, `npm test` and real browser smoke. Network-restricted build environment here could only run Node tests and TS transpilation.
- Never label a payout received merely because the source chain transaction is finalized. Validate child transfer.

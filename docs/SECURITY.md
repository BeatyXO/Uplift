# Uplift security review / threat model (pre-deployment)

Scope: `contracts/Uplift.py` and browser signing flows. This is author analysis, **not an external audit**.

## Main assets

1. The actual GEN sent to each program's ghost-contract/account on StudioNet.
2. Frozen program parameters, evidence hashes, outcome status vector and escrow allocation.
3. Participants' addresses, wallets, signing actions and evidence source URLs.

## Invariants implemented and tested in the Python shim

- Contributing GEN only occurs in `FUNDING`, before the funding deadline. Zero/oversized amounts are rejected.
- Each program's money pool is the sum of actual payable `gl.message.value` inputs (not a user-specified expected budget).
- Only one beneficiary can submit an impact claim. After submission, funds stop entering the pool and its baseline/outcome policy remains frozen.
- Only funded donors, excluding sponsor and beneficiary, can challenge. Max one per wallet and three total. Caveat: donors are pseudonymous; sybil resistance is not claimed.
- Independent validator runs re-fetch committed data and compare decisive fields; hash or model failure is not an automatic acceptance.
- Payout amount = `floor(pool * sum(PROVEN outcome weights) / 10,000)`.
- Every donor's precise refund is derived using monotonic cumulative integer rounding. `award + sum(refunds) == pool` exactly, including one-wei remainders.
- Refund and award credit is zeroed in contract storage **before** an outgoing external message. One wallet cannot claim the same credit twice.
- After missed claim and review timeout, the entire pool becomes refundable, rather than defaulting to the beneficiary.

## Open risks / important qualifications

**1. Outgoing message liveness (HIGH / P0):** GenLayer external value transfer messages execute after source finality. If a child transfer fails, its value is not automatically credited back to Uplift. The stored credit is already burned to prevent double withdrawal. No contract-verifiable callback/acknowledgement or safe retry/recovery path has been established. A successful parent `withdraw_*` is not proof of delivery; the child transaction and recipient balance movement must be checked. This is a **release blocker** for any real-value deployment. See [Financial settlement specification](FINANCIAL_SETTLEMENT.md). The UI does not yet automate child reconciliation.

**2. False claims and weak causality (HIGH):** A timestamped and hashed document is not evidence of truth or causality. Consensus can faithfully agree on an inadequate standard or misleading report. Applications should require credible primary records, preferably third-party sources. Real human oversight is still advisable.

**3. Sybil donors / capacity exhaustion (MEDIUM):** Each new distinct contributor consumes one of 32 seats; spam pledges could fill the capacity on low-fee testnet. A minimum contribution, reputation gate or new registry would improve availability but bring other tradeoffs.

**4. Malicious evidence instruction injection (MEDIUM):** Raw documents are placed into an explicit untrusted JSON field and model instructions require ignoring embedded commands. This is a defense, not an infallible guarantee. Test with adversarial evidence at runtime.

**5. External evidence liveness (MEDIUM):** Even commit-pinned GitHub URLs can go offline, be deleted or be blocked for particular validators. Uplift refuses mismatched bytes, leaving REVIEW pending; anyone can invoke timeout after 14 days. That protects money at the cost of delayed outcomes.

**6. Contest opportunity (MEDIUM):** Counterevidence is limited to funded donors to reduce spam, which excludes outside whistleblowers. The 24-hour challenge window may be short for community scrutiny. Making the window longer improves fairness but increases lockup duration.

**7. Exact status vector liveness (LOW–MEDIUM):** Leader and validators must match the ordered categorical statuses exactly. This prevents 'close enough' unjustified acceptance but may produce disagreements in ambiguous cases, requiring more validator rotations or eventually refund timeout.

**8. No financial caps per identity (LOW–MEDIUM):** A wealthy donor can dominate funding amount (though cannot change the outcome weight schedule after program creation). There is no identity verification or fairness guarantee.

**9. Frontend trust (MEDIUM):** Browser clients validate entered contract address syntax but cannot prove the address hosts Uplift code before user interaction. Verify deployed source hash and explorer address against the signed deployment manifest. Never paste a private key into the website.

**10. Review model cost (MEDIUM):** Each evaluation fetches up to 5 public documents and invokes AI consensus. Fee profiling, runtime metering and gas/fee caps are necessary before deployment.

## Go/no-go gate

**NO-GO** for value custody and StudioNet deployment until: GenVM lint and typecheck pass on the pinned runner; the error callback is triggered by an actual failed value child with the expected recipient/value; retry success/failure and child finality are reconciled with EOA balance deltas; full assessment/challenge consensus paths pass; wallet switch/rejection are tested; and UI build/mobile browser checks pass. The contract now overrides GenLayer's documented `__on_errored_message__` hook and Direct Mode tests its state logic, but those tests do not prove callback dispatch by StudioNet. Keep `deployments/studionet.json` at `NOT_DEPLOYED` until that release gate passes.

# Uplift financial settlement specification

## Scope and release decision

This document describes the current contract, not a proposed recovery mechanism. Uplift computes an allocation of GEN held by its contract, but its current external payout path cannot guarantee recovery after a child transfer fails. Until GenLayer exposes a contract-verifiable recovery primitive and that primitive is tested, this implementation is **NO-GO for value custody**. Do not treat it as a safe public funding product.

## Funding custody and accounting

Each accepted contribution is the actual payable `gl.message.value`, added to the program pool and attributed to the normalized donor address. Funding is bounded by the contract's funding phase, deadline, pool limit and donor capacity. The sponsor cannot withdraw the pool through an administrative path.

Once the outcome vector is finalized, the beneficiary entitlement is the integer floor of `pool * proven_weight / 10,000`. Donor refund shares are assigned using cumulative integer rounding. The contract checks that the award plus all refunds equals the pool, including remainder wei. No-claim expiry, sponsor cancellation before a claim, and unresolved-review timeout make the pool refundable. AI consensus selects only the ordered outcome classifications; deterministic contract code calculates the money.

These are accounting liabilities recorded in contract state. They do not prove that the contract's spendable balance equals all liabilities after asynchronous external messages have been emitted.

## Current payment lifecycle

1. **Claimable:** finalized contract state records a donor refund or beneficiary award.
2. **Withdrawal initiated:** the entitlement is cleared from contract storage and an external value-transfer child message is emitted in the parent transaction.
3. **Child outcome:** the child is processed independently after its parent reaches the configured finality state. Successful child execution transfers value; failed child execution does not automatically return that value to Uplift.
4. **Delivered:** this can only be stated after the child is observed successful and recipient balance movement is reconciled. A successful or finalized parent alone is not delivery evidence.

The current contract has no on-chain `pending`, `failed`, `recoverable` or `withdrawn` reconciliation states. Its zero-before-message effects prevent a second withdrawal from the same entitlement, but they can also leave the entitlement consumed if its child transfer fails. The UI and operators must never label the parent withdrawal as “Paid”.

## Recovery and duplicate prevention

The official GenLayer value-transfer semantics documented at <https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers> state that a failed child value transfer is not automatically credited back to the sender. Child transactions are separate from their parent. A retry based only on an RPC timeout or missing receipt is unsafe: the original child may still succeed, causing duplicate payment if an equivalent entitlement is restored or resent.

The current contract has no callback/acknowledgement path that atomically reconciles child success or failure into the source entitlement. Off-chain observation alone cannot authorize an on-chain refund safely without a protocol-verifiable child identity and terminal failure proof available to the contract. No administrator redirection or manual compensation path is implemented. Therefore failed or ambiguous child outcomes have no safe recovery in this release.

For every future live test, record parent and child transaction identifiers, terminal status and execution result, and recipient balance deltas. On RPC 403/502/timeout, preserve the observed transaction identifiers and resume receipt inspection; do not resubmit blindly. Never use live-value tests to simulate recovery that the contract cannot prove.

## Required release gate

Keep deployment manifest status `NOT_DEPLOYED`. Do not enable public real-value funding or withdrawals until a supported runtime primitive enables exact, verifiable reconciliation and tests establish all of the following: a failed child restores only its original entitlement; a pending or ambiguous child cannot be retried; a successful child cannot be paid twice; unrelated accounts cannot recover another party's funds; and aggregate liabilities remain conserved through every transition. Then independently review and rerun the financial lifecycle suite before any testnet deployment.

This limitation does not invalidate the deterministic allocation invariant. It prevents claiming that calculated entitlements are reliably delivered.

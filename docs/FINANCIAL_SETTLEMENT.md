# Uplift financial settlement specification

## Scope and release decision

Uplift computes an allocation of GEN held by its contract. The contract now implements GenLayer's documented payable `__on_errored_message__` hook: a failed value-bearing message returns its value to the source contract, and the hook credits that value to the failed transfer's recipient. That recipient alone can request another transfer. The implementation is covered by local Direct Mode logic tests and pinned SDK schema/type checks.

This is not yet proof that StudioNet's deployed protocol dispatches the hook with the recipient in `gl.message.sender_address`, or that the returned value and callback state are finalized as expected. Accordingly, Uplift remains **NO-GO for value custody and deployment** until a controlled StudioNet failed-child test verifies callback dispatch, recipient identity, restored contract balance, retry behavior, successful child finality, and recipient balance deltas. The API documents the hook in the [GenLayer SDK v0.2.9 reference](https://sdk.genlayer.com/v0.2.9/api/genlayer.html#genlayer.gl.Contract.__on_errored_message__) and its [source](https://sdk.genlayer.com/v0.2.9/_modules/genlayer/gl/genvm_contracts.html); the transfer docs confirm failed child value is not automatically returned absent custom handling.

## Funding custody and accounting

Each accepted contribution is the actual payable `gl.message.value`, added to the program pool and attributed to the normalized donor address. Funding is bounded by the contract's funding phase, deadline, pool limit and donor capacity. The sponsor cannot withdraw the pool through an administrative path.

Once the outcome vector is finalized, the beneficiary entitlement is the integer floor of `pool * proven_weight / 10,000`. Donor refund shares are assigned using cumulative integer rounding. The contract checks that the award plus all refunds equals the pool, including remainder wei. No-claim expiry, sponsor cancellation before a claim, and unresolved-review timeout make the pool refundable. AI consensus selects only the ordered outcome classifications; deterministic contract code calculates the money.

These are accounting liabilities recorded in contract state. They do not prove that the contract's spendable balance equals all liabilities after asynchronous external messages have been emitted.

## Current payment lifecycle

1. **Claimable:** finalized contract state records a donor refund or beneficiary award.
2. **Withdrawal initiated:** the entitlement is cleared from contract storage and an external value-transfer child message is emitted in the parent transaction.
3. **Child outcome:** the child is processed independently after its parent reaches the configured finality state. Successful child execution transfers value. For a failed non-zero-value child, the SDK specifies an error callback on the source contract; Uplift's override records the refunded value against the failed message sender (intended to be the payout recipient, pending live verification).
4. **Delivered:** this can only be stated after the child is observed successful and recipient balance movement is reconciled. A successful or finalized parent alone is not delivery evidence.

The original program entitlement is zeroed before the external message, so it cannot be withdrawn twice. If the runtime callback fires, the returned value becomes an address-scoped recovered payout, separate from program-level entitlements. The retry path also clears that recovered balance before emitting its child message; another failure is expected to restore the same address-scoped balance. An unresolved child does not trigger a retry and therefore cannot be double-paid by an optimistic resubmission. The UI and operators must never label the parent withdrawal as “Paid”.

## Recovery and duplicate prevention

The official GenLayer value-transfer semantics documented at <https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers> state that a failed child value transfer is not automatically credited back to the sender. Child transactions are separate from their parent. A retry based only on an RPC timeout or missing receipt is unsafe: the original child may still succeed, causing duplicate payment if an equivalent entitlement is restored or resent.

The callback supplies the refunded value and sender context without exposing a child transaction identifier. Uplift uses the callback context to credit the recipient, and does not provide admin redirection. The outcome is safe only if that sender field is the failed transfer's recipient and the protocol calls the hook once for each failed child, never for a successful child. A caller who invokes the payable hook directly can only credit their own supplied value when `sender_address` is their address; this edge case also requires protocol/runtime verification. No recipient can claim another address's recovered balance.

For every future live test, record parent and child transaction identifiers, terminal status and execution result, and recipient balance deltas. On RPC 403/502/timeout, preserve the observed transaction identifiers and resume receipt inspection; do not resubmit blindly. Never use live-value tests to simulate recovery that the contract cannot prove.

## Required release gate

Keep deployment manifest status `NOT_DEPLOYED`. Do not enable real-value funding or withdrawals until a controlled StudioNet lifecycle establishes all of the following: a failed child dispatches the hook exactly once with the correct recipient and exact value; a pending or ambiguous child remains locked; a successful child does not invoke recovery; a failed retry restores the same recipient balance; unrelated accounts cannot recover another party's funds; and aggregate liabilities and GEN balances reconcile through every transition. Direct Mode currently exercises callback logic only; it does not simulate child scheduling or protocol callback dispatch. Then independently review and rerun the financial lifecycle suite before deployment.

This limitation does not invalidate the deterministic allocation invariant. It prevents claiming that calculated entitlements are reliably delivered.

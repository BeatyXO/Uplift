# StudioNet failed-child recovery status

Updated: 2026-10-23

## Status

**NOT VERIFIED for Uplift's external EVM payout path. Public funding remains NO-GO until that test passes.** This is a production/public-funding release gate; it is not a blocker to submitting the prototype for steward review.

Uplift implements the payable `__on_errored_message__` callback and recipient-only `withdraw_recovered_payout` retry. GenLayer Direct Mode tests the contract's recovery state logic, but that does not establish that StudioNet dispatches the callback with the correct failed recipient and returned value. Successful payout children do not prove failed-payment recovery.

## StudioNet testability constraint

The controlled recipient required below must be an EVM contract whose first value receipt reverts and whose later receipt succeeds. GenLayer's current [Messages documentation](https://docs.genlayer.com/developers/intelligent-contracts/features/messages) says Studio does not implement EVM-contract interactions beyond value transfers to EOAs. Its [Value Transfers documentation](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers) says Studio balances are simulated and there is no EVM layer or ghost contracts in Studio. A plain EOA cannot be programmed to reject an incoming value transfer. Therefore, the required controlled failure cannot currently be induced on hosted StudioNet using its supported recipient types; a successful EOA transfer or a Direct Mode callback simulation is not an acceptable substitute.

An isolated StudioNet probe was run on 2026-10-23. A controlled GenLayer payable receiver deliberately errored on a value-bearing internal child. The child finalized with `execution_result = ERROR` and `value_credited = true`; the receiver balance increased by the exact `10000000000000` wei, while the sender callback count and recovered credit remained zero. A separate EOA/no-IC routing attempt finalized `NO_MAJORITY` at `contract_not_found_handler`, also without callback credit. These are observed child failures, but neither exercises Uplift's external EVM payout failure. Full receipts, state reads, and wallet accounting are in [STUDIONET_RECOVERY_PROBE.md](STUDIONET_RECOVERY_PROBE.md).

Do not switch to Studio-dev or another network and label it StudioNet proof. The required EVM-reverting recipient test must be run when StudioNet supports it, or through an alternative EVM-capable environment explicitly accepted by the steward. Record the exact environment and do not mark the StudioNet-specific finding complete based on another chain.

## Required live test

When a controlled reverting recipient is supported, run against an isolated StudioNet test deployment with minimal test funds and a recipient that rejects the first payout and accepts a later retry. Do not use a public-funding deployment.

1. Create and settle a test program with a small, non-zero payout to the controlled recipient.
2. Submit the recipient's withdrawal and record the finalized parent transaction plus the child transaction's failed status and receipt.
3. Read `get_recovered_payout(recipient)` and verify it equals the exact failed child value. Record the contract balance before and after callback finalization to verify the returned value is available again.
4. Configure the recipient to accept value, then have that same recipient initiate `withdraw_recovered_payout`.
5. Record the retry parent and child receipts. Verify the child is finalized successfully, its destination is the original recipient, and its value equals the recovered amount.
6. Record the recipient balance before and after the successful child. Verify the balance increases by the exact payout, and a fresh `get_recovered_payout(recipient)` read returns zero.
7. Check for duplicate or remaining liabilities; preserve all transaction hashes, receipts, and balance snapshots in the evidence report.

## Release gate

Do not mark this recovery path verified or approve public value custody until every step above is supported by observed StudioNet receipts and balance reads. Keep `deployments/studionet.json` at `NOT_DEPLOYED` until this and the other release gates pass.

Related evidence and design notes: [`LOCAL_TEST_REPORT.md`](LOCAL_TEST_REPORT.md), [`FINANCIAL_SETTLEMENT.md`](FINANCIAL_SETTLEMENT.md), [`SECURITY.md`](SECURITY.md), and [`STUDIONET_STATUS_AND_VERCEL.md`](STUDIONET_STATUS_AND_VERCEL.md).

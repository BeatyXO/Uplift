# StudioNet failed-child recovery status

Updated: 2026-10-21

## Status

**NOT VERIFIED on StudioNet. Public funding remains NO-GO until this test passes.** This is a production/public-funding release gate; it is not a blocker to submitting the prototype for steward review.

Uplift implements the payable `__on_errored_message__` callback and recipient-only `withdraw_recovered_payout` retry. GenLayer Direct Mode tests the contract's recovery state logic, but that does not establish that StudioNet dispatches the callback with the correct failed recipient and returned value. Successful payout children do not prove failed-payment recovery.

## Required live test

Run against an isolated StudioNet test deployment with minimal test funds and a controlled recipient that rejects the first payout and accepts a later retry. Do not use a public-funding deployment.

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

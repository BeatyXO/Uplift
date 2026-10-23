# Steward MIN remediation

Updated: 2026-10-24

## Finding 1: counterevidence could block settlement

**Status: addressed in source and covered by tests.** Before this change, a donor could register a URL and digest without proving that the referenced document existed or matched the commitment. An invalid challenge could later make assessment fail and eventually lead to a timeout refund.

Challenge admission now retrieves the pinned bytes and validates availability, declared byte length, SHA-256, and UTF-8 text before adding a challenge. The leader and validators independently retrieve and compare the content during admission. Invalid entries do not occupy a challenge slot. The exact verified text is stored with the admitted challenge and checked again during assessment, so a later host outage or document change cannot prevent assessment. The existing contribution eligibility rule remains unchanged, including for a donor who made a minimal valid contribution.

Coverage includes incorrect digests, incorrect byte lengths, unavailable documents, validator disagreement on fetched bytes, a valid minimal-contribution donor, and assessment succeeding after the source becomes unavailable. These checks run both in the Python contract test suite and GenLayer Direct Mode; their external evidence and LLM responses are stubbed as required for deterministic tests.

## Finding 2: live StudioNet failed-child recovery

**Status: external EVM payout recovery remains unverified.** A live StudioNet probe on 2026-10-23 finalized a value-bearing payable IC child with `execution_result = ERROR` and `value_credited = true`; the recipient balance rose by exactly 0.00001 GEN, but the source callback count and recovered credit stayed at zero. A separate no-IC EOA routing child finalized `NO_MAJORITY` without callback credit. Neither exercises Uplift's external EVM payout path, which StudioNet currently cannot test with a controlled reverting EVM recipient. Full receipts and balance reads are in [STUDIONET_RECOVERY_PROBE.md](STUDIONET_RECOVERY_PROBE.md); the remaining external test steps are in [FAILED_CHILD_RECOVERY_STATUS.md](FAILED_CHILD_RECOVERY_STATUS.md).

This remains a public-funding release gate. It is not represented as a completed live-chain test or as proof supplied for the steward review.

## Verification completed for this remediation

- `python -m pytest -q tests` — 52 passed.
- `python -m pytest -q direct_tests` — 9 passed.
- `genvm-lint check contracts/Uplift.py --json` — lint checks passed.
- `genvm-lint typecheck contracts/Uplift.py --json` with pinned `GENVM_VERSION=v0.3.0-rc7` — passed with zero diagnostics.
- Frontend tests — 21 passed; frontend typecheck and production build passed.
- Playwright desktop/mobile E2E — 6 passed on the warm rerun.
- `npm audit --omit=dev` — zero vulnerabilities.

These are local/source verification results. They do not replace the still-pending live failed-child test. The hosted real-wallet contribution/cancellation/refund lifecycle was completed on October 24, 2026 and is recorded with transaction IDs and balance reads in [`LOCAL_TEST_REPORT.md`](LOCAL_TEST_REPORT.md).

## Suggested steward resubmission note

The following response is 931 characters and stays within the MIN form's 1,000-character limit:

> Thank you for the review. We fixed counterevidence admission: challenges require leader and validator retrieval of matching UTF-8 bytes, size, and SHA-256; invalid or unavailable sources consume no slot. Python and Direct Mode tests cover bad digests, sizes, unavailable sources, validator disagreement, minimal donors, and post-admission source outages. Full/partial assessments and a real wallet contribution/cancellation/refund on the Vercel app are documented with receipts and balances. The wallet-status bug is fixed and pushed. The requested failed external EVM child test cannot be done on StudioNet: Studio does not execute EVM contracts, and external value transfers are supported only to EOAs, leaving no controlled rejecting recipient. The internal-message probe did not test Uplift’s external callback/retry. Public funding remains disabled. Please confirm whether an alternative EVM-capable environment is acceptable.

We addressed the counterevidence admission issue. A challenge is now admitted only after the leader and validators retrieve matching bytes and verify the declared size and SHA-256. Invalid or unavailable submissions do not consume a challenge slot; verified text is retained and integrity-checked during assessment so a later source outage cannot block settlement. Regression coverage includes incorrect digests, incorrect sizes, unavailable sources, validator disagreement, minimal-contribution donors, and post-admission source outage in both Python tests and GenLayer Direct Mode.

The live StudioNet failed-child callback and retry procedure is still unverified. We have kept it explicitly identified as a public-funding release gate and have not claimed live-chain proof. The current resubmission addresses the counterevidence finding without misrepresenting that separate live recovery test as complete.

We also completed a hosted wallet-connected StudioNet contribution, cancellation, and refund lifecycle using a disposable test program. The parent withdrawal succeeded, its child transfer finalized for exactly 0.001 GEN to the connected wallet, and a fresh contract read showed the refund entitlement at zero. Transaction IDs and before/after wallet balances are in [`LOCAL_TEST_REPORT.md`](LOCAL_TEST_REPORT.md). This successful transfer does not demonstrate recovery from a failed child payment.


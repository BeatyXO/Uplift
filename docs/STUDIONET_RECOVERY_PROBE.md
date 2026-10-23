# StudioNet recovery probe evidence

Date: 2026-10-23  
Network: `studionet`, chain ID `61999`  
Result: **FAILED RECOVERY ASSERTION / production path still unverified**

## Scope

This was an isolated protocol probe, not a public-funding deployment. The test-only contracts are [`StudioNetFailureProbe.py`](../tests/fixtures/StudioNetFailureProbe.py) and [`StudioNetRejectingReceiver.py`](../tests/fixtures/StudioNetRejectingReceiver.py). They test a value-bearing internal GenLayer call to a controlled recipient. The production Uplift payout path uses an external EVM value transfer, so this probe cannot establish that an EVM revert invokes Uplift's callback.

## Controlled execution-error child

- Rejecting receiver deployment: `0xd848eA39209ee49c925EAbc64beEC86a61D071d9`; deployment transaction `0xf89a3b9252c938b650a24082d059af263b64f8449da464e8d5f00f284bb02d87`, `FINALIZED`.
- Probe deployment: `0x2bC2c0f1748b2F0eE609C8eB2E7D829842DdF7E8`; deployment transaction `0x7b622f4ef8b334647e8cfa0cb811794acf3a0896d1d46d2d65da6e2ad0f7d120`, `FINALIZED`.
- Probe funding: `0.00001 GEN` (`10000000000000` wei), transaction `0x9ec75ece87a94a4a987cfa9a11d83e50c304bc85ec4b2e2104aeb8b756e02511`.
- Failure-trigger parent: `0x204a87e5cc0dd3a5678c826513629f08150448c7b8b4a76a0cc8aec6310b114b`, `FINALIZED`, `MAJORITY_AGREE`. Its receipt records a value-bearing child to the rejecting receiver for exactly `10000000000000` wei.
- Child: `0xe6a9677e115669bf153f3191c1f956609f30782a8651a117ebaf6aa7f9b2fd48`, `FINALIZED`, `execution_result = ERROR`, `result_name = MAJORITY_AGREE`, `value_credited = true`.

Post-child reads:

- Probe `get_callback_count()`: `0`.
- Probe `get_recovered_payout(receiver)`: `0`.
- Probe `get_balance()`: `0`.
- Receiver `get_rejecting()`: `true`; `get_accepted_total()`: `0`.
- Receiver `get_balance()`: `10000000000000` wei.

The method deliberately errored, but StudioNet credited the full value to the receiver's contract balance. The source callback did not run, so there was no recovered credit to retry. No retry was submitted. This is not a successful failed-payment recovery test.

## EOA/no-IC control attempt

A separate probe call targeted tenant 2's EOA as an internal message. Parent `0x76f84ca6917e544a822fe9cd309d8c0a8595b9137c38847c37dfc616440b080f` finalized `MAJORITY_AGREE` and emitted child `0x0969754c240d490c71a2052a42f9393acb5f60ea6c04e552de71ddcb36ad04e6`. The child finalized `NO_MAJORITY`; its leader was `contract_not_found_handler` with zero validator commits. This is an internal no-contract routing failure, not an EVM-recipient revert. Callback count and recovered credit remained zero, the probe balance fell from `10000000000000` to zero, and tenant 2's EOA balance read was `0.0925 GEN` both before and after. This attempt also did not provide a retry credit.

## Wallet/test-fund accounting

- Tenant 1 (`0x5516488131150CCBe76341E5ABD472013ECaa666`): observed `0.1075 GEN` before probe funding; final read `0.10746 GEN` after four `0.00001 GEN` probe deposits.
- Tenant 2 (`0x4dcd388daacc30a6a427b92c6001cd31a2eb2576`): observed `0.0925 GEN` before and after; no recovery retry was submitted.
- Two exploratory probes each still showed `10000000000000` wei in their balances at the last successful read. One later read of the first probe failed with an RPC `fetch failed`; it was not retried. The controlled receiver currently holds `10000000000000` wei. These are isolated test artifacts, not Uplift project balances.

## Conclusion

This experiment does not meet the steward's requirement to prove Uplift's external EVM child failure, callback credit, and retry. StudioNet's [Messages documentation](https://docs.genlayer.com/developers/intelligent-contracts/features/messages) says EVM-contract interaction beyond EOA value transfers is not implemented in Studio; its [Value Transfers documentation](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers) describes Studio balances as simulated without an EVM layer or ghost contracts. A controlled EVM receiver revert is therefore unavailable in this environment. Keep public funding **NO-GO** until the exact external path is tested in a suitable EVM-capable environment accepted by the steward, or StudioNet adds support for that test.

The local trace endpoint `gen_dbg_traceTransaction` was unavailable (`Method not found`). Receipts and reads above are the evidence used; no trace details are inferred.

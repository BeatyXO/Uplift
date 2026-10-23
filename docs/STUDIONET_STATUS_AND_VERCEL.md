# StudioNet status and Vercel configuration

Updated: 2026-10-21

## What has actually been deployed and exercised

Uplift has **test-only** deployments on GenLayer StudioNet (chain ID `61999`). The corrected contract at `0xd8173621f871740A5447c954701ACc2196b804Bb` finalized with successful execution and majority agreement. A separate fast-window fixture at `0x2C64F7BF0A156b03B250321CD893E3bb2188308A` was used for the full- and partial-earning cycles recorded in [`LOCAL_TEST_REPORT.md`](LOCAL_TEST_REPORT.md). Those cycles finalized, emitted payout children that finalized, and produced the recorded recipient balance deltas.

Those successful transfers do **not** test the failure callback. No live child-payment failure, callback credit, recovery retry, or post-retry balance delta has been observed. Public-value funding therefore remains **NO-GO**.

`deployments/studionet.json` remains `NOT_DEPLOYED` by release policy: it is the release manifest, and no deployment is approved for release until failed-child recovery and the remaining release gates pass. This status does not mean no test contract was ever deployed. The addresses above are isolated test contracts and must not be presented as production deployments.

## Vercel environment variable

For a **testnet preview/demo**, add this project environment variable in Vercel:

```text
VITE_UPLIFT_CONTRACT_ADDRESS=0x2C64F7BF0A156b03B250321CD893E3bb2188308A
```

This is a public build-time frontend setting, not a secret. It points at the isolated 60-second StudioNet fixture, not a production contract. Use it for a Preview deployment only while the release gate is open. Do not configure a production launch to accept public funding with this address. After Vercel saves the variable, redeploy so Vite embeds it in the browser bundle.

The app's chain is fixed to StudioNet `61999`; there are no RPC key, wallet private key, or server-side secret environment variables required by this frontend. The Vercel deployment itself is the user's step.

## Failed-child recovery verification still required

The contract implements `__on_errored_message__`, and GenLayer Direct Mode tests its state logic. Those checks do not prove that StudioNet dispatches the hook for a failed external child. The live acceptance run must capture all of the following from a controlled isolated deployment using minimal test funds:

1. A finalized parent payout and its actual failed child receipt, with the recipient and value recorded.
2. A finalized callback showing the exact failed recipient and value credited to `get_recovered_payout`, plus the corresponding contract balance restoration.
3. A recipient-signed recovery retry, its finalized successful child, and the exact recipient EOA balance increase.
4. Fresh reads proving the recovered amount is zero after successful retry and that no duplicate claim remains.

No failure has been deliberately triggered. In addition to the local toolchain lacking `forge`, `solc`, and `cast`, current GenLayer docs state that hosted Studio does not implement EVM-contract interaction beyond value transfers to EOAs and has no EVM layer or ghost contracts for Studio balances. That prevents a controlled rejecting EVM recipient on StudioNet, even if a local Solidity compiler is installed. This remains the exact StudioNet testability constraint; do not claim the recovery path verified until a supported test environment produces the required receipts and balance changes. See [`FAILED_CHILD_RECOVERY_STATUS.md`](FAILED_CHILD_RECOVERY_STATUS.md), [`FINANCIAL_SETTLEMENT.md`](FINANCIAL_SETTLEMENT.md), and [`SECURITY.md`](SECURITY.md).

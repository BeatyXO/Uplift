# Uplift recovery implementation evidence

The current `contracts/Uplift.py` contains this recovery path:

```python
@gl.public.write.payable
def __on_errored_message__(self) -> None:
    failed_value = int(gl.message.value)
    if failed_value <= 0:
        raise _UserError("Failed transfer callback requires refunded value")
    recipient = _address(gl.message.sender_address)
    self.recovered_payouts[recipient] = str(
        int(self.recovered_payouts.get(recipient, "0")) + failed_value)

@gl.public.write
def withdraw_recovered_payout(self) -> u256:
    recipient = _caller()
    amount = int(self.recovered_payouts.get(recipient, "0"))
    if amount <= 0:
        raise _UserError("No recovered payout")
    self.recovered_payouts[recipient] = "0"
    _Recipient(Address(recipient)).emit_transfer(value=u256(amount))
    return u256(amount)
```

Direct Mode exercises the callback state logic. No failed-child callback has been observed on StudioNet, so protocol dispatch, recipient/value semantics, retry finality, and real wallet deltas remain unverified.

This source-code test does not claim that StudioNet invokes the hook, that any real-world outcome occurred, or that public funding is safe.

# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Isolated live probe for StudioNet failed value-message callback semantics.

This is test-only. It emits an INTERNAL value-bearing call to a controlled
Intelligent Contract that first reverts and later accepts. It probes real
callback dispatch, recipient/value context, and a successful retry on
StudioNet. It does not emulate an EVM recipient reverting Uplift's external
EOA-transfer child message.
"""

from genlayer import *


@gl.contract_interface
class _TestReceiver:
    class View:
        pass

    class Write:
        def accept_or_reject(self) -> None: ...


class StudioNetFailureProbe(gl.Contract):
    recovered_payouts: TreeMap[str, str]
    callback_count: u256

    def __init__(self):
        self.callback_count = u256(0)

    @gl.public.write
    def fail_internal_payment(self, recipient: Address, amount: u256) -> None:
        if amount <= u256(0):
            raise gl.vm.UserError("Amount must be positive")
        _TestReceiver(recipient).emit(value=amount, on="finalized").accept_or_reject()

    @gl.public.write.payable
    def __on_errored_message__(self) -> None:
        amount = int(gl.message.value)
        if amount <= 0:
            raise gl.vm.UserError("Callback requires refunded value")
        recipient = gl.message.sender_address.as_hex.lower()
        self.recovered_payouts[recipient] = str(
            int(self.recovered_payouts.get(recipient, "0")) + amount
        )
        self.callback_count = self.callback_count + u256(1)

    @gl.public.write
    def retry_recovered_payment(self) -> u256:
        recipient = gl.message.sender_address.as_hex.lower()
        amount = int(self.recovered_payouts.get(recipient, "0"))
        if amount <= 0:
            raise gl.vm.UserError("No recovered payout")
        self.recovered_payouts[recipient] = "0"
        _TestReceiver(Address(recipient)).emit(value=u256(amount), on="finalized").accept_or_reject()
        return u256(amount)

    @gl.public.view
    def get_recovered_payout(self, recipient: Address) -> u256:
        key = recipient.as_hex.lower()
        return u256(int(self.recovered_payouts.get(key, "0")))

    @gl.public.view
    def get_callback_count(self) -> u256:
        return u256(self.callback_count)

    @gl.public.view
    def get_balance(self) -> u256:
        return u256(self.balance)


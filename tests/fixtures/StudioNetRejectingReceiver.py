# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Test-only StudioNet receiver that rejects value until enabled."""

from genlayer import *


class StudioNetRejectingReceiver(gl.Contract):
    rejecting: u256
    accepted_total: u256

    def __init__(self):
        self.rejecting = u256(1)
        self.accepted_total = u256(0)

    @gl.public.write.payable
    def accept_or_reject(self) -> None:
        if self.rejecting != u256(0):
            raise gl.vm.UserError("Receiver intentionally rejects this payment")
        self.accepted_total = self.accepted_total + gl.message.value

    @gl.public.write
    def accept_payments(self) -> None:
        self.rejecting = u256(0)

    @gl.public.write
    def retry_probe_payment(self, probe: Address) -> None:
        gl.get_contract_at(probe).emit(on="finalized").retry_recovered_payment()

    @gl.public.view
    def get_rejecting(self) -> bool:
        return self.rejecting != u256(0)

    @gl.public.view
    def get_accepted_total(self) -> u256:
        return u256(self.accepted_total)

    @gl.public.view
    def get_balance(self) -> u256:
        return u256(self.balance)

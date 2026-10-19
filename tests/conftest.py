"""Behavioral GenLayer emulator for deterministic tests; NOT validator/network proof."""
import importlib.util
import json
import pathlib
import sys
import types
import pytest

ROOT = pathlib.Path(__file__).resolve().parents[1]
ctx = types.SimpleNamespace(sender="0x"+"1"*40, value=0, chain_id=61999, now=1000000,
                            responses={}, status=["PROVEN"], transfers=[], corrupt=False,
                            validator_override=None)

class Address:
    def __init__(self, value): self.as_hex = str(value)

class TreeMap(dict):
    def __class_getitem__(cls, item): return cls

class DynArray(list):
    def __class_getitem__(cls, item): return cls

class Contract:
    def __init__(self):
        for name, anno in type(self).__annotations__.items():
            if anno == "TreeMap[str, str]" or getattr(anno, "__name__", "") == "TreeMap":
                setattr(self, name, TreeMap())
            if anno == "DynArray[str]" or getattr(anno, "__name__", "") == "DynArray":
                setattr(self, name, DynArray())

class UserError(Exception): pass

class Return:
    def __init__(self, calldata): self.calldata=calldata

class Write:
    def __call__(self, fn): return fn
    def payable(self, fn): return fn

class Public:
    write = Write()
    def view(self, fn): return fn

class Evm:
    @staticmethod
    def contract_interface(cls):
        def init(self, address): self.address=address
        def emit(self, *, value): ctx.transfers.append((self.address.as_hex, int(value)))
        cls.__init__=init
        cls.emit_transfer=emit
        return cls

class NondetWeb:
    def get(self, url):
        if url not in ctx.responses: return types.SimpleNamespace(status=404,body=b"")
        return types.SimpleNamespace(status=200,body=ctx.responses[url])

class Nondet:
    web = NondetWeb()
    def exec_prompt(self, prompt, response_format="json"):
        return {"statuses": list(ctx.status)}

class VM:
    UserError=UserError
    Return=Return
    Result=Return
    def run_nondet_unsafe(self, leader, validator):
        decision=leader()
        if ctx.validator_override is not None:
            decision["statuses"] = list(ctx.validator_override)
        if not validator(Return(decision)):
            raise UserError("validator DISAGREE")
        return decision

class Message:
    @property
    def sender_address(self): return Address(ctx.sender)
    @property
    def chain_id(self): return ctx.chain_id
    @property
    def value(self): return ctx.value

shim=types.ModuleType("genlayer")
shim.gl=types.SimpleNamespace(Contract=Contract, public=Public(), evm=Evm(),vm=VM(),
                              message=Message(),nondet=Nondet())
shim.Address=Address
shim.TreeMap=TreeMap
shim.DynArray=DynArray
shim.u256=int
sys.modules["genlayer"]=shim
spec=importlib.util.spec_from_file_location("uplift_contract", ROOT / "contracts" / "Uplift.py")
uplift=importlib.util.module_from_spec(spec)
spec.loader.exec_module(uplift)
uplift._now=lambda: ctx.now

@pytest.fixture
def world():
    ctx.sender="0x"+"1"*40
    ctx.value=0
    ctx.chain_id=61999
    ctx.now=1000000
    ctx.responses={}
    ctx.status=["PROVEN"]
    ctx.transfers=[]
    ctx.corrupt=False
    ctx.validator_override=None
    contract=uplift.Uplift()
    for name in ("programs", "pledge", "refunds", "disputes"):
        setattr(contract, name, TreeMap())
    contract.program_ids = DynArray()
    return contract, ctx, uplift

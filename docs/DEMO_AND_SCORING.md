# Uplift reviewer/demo plan — evidence-based scoring, not a fabricated score

Potential rubric weights (author's **target**, not an official GenLayer ranking):

| Category | Evidence needed to earn a strong score |
|---|---|
| GenLayer fit | Discretionary AI outcome evaluation grounded in frozen real-world standards; live independent validator reproduction and decision-field equivalence. |
| Contract quality | Signed authorization, immutable policies, deterministic settlement arithmetic, replay/duplicate defense, exact money conservation, fail-closed evidence, explicit liveness/timeout. |
| Engineering | Source-pinned deployment, transaction IDs, independent tests, reproducible build and CI, typed wallet SDK, no silent retries, partial failure recovery, complete docs. |
| Frontend | Distinct information architecture, accessible mobile layout, current chain reads, wallet flow, evidence drill-down, transparency on finality and failure. |

## Suggested reviewer walkthrough (requires real deployment)

- Open Uplift. The portfolio shows real StudioNet stats; visit the program registry and inspect policy hashes and evidence links.
- Create an education or water-access impact program with a verifiable third-party baseline and 2 outcomes weighted 60/40.
- Two wallets fund the same program with test GEN. Verify exact on-chain donor balances.
- Beneficiary submits a report; one donor submits a contradictory independent record.
- Compare leader and validator categorical outcomes; verify that the credible contradiction cannot earn its tranche.
- Observe partial award and donor refund math, and withdraw both while confirming triggered child outcomes.
- Demonstrate expiry and review timeout on separate programs; show no one can steal third-party refunds.
- Demonstrate hostile embedded instructions in evidence and independent disagreement; neither should bypass consensus.
- Show mobile layout and usable wallet UX; inspect the public deployment/evidence JSON and tests.

## Current checklist

- [x] Original contract, frontend and security documentation authored.
- [x] Behavioral tests (49 cases) pass locally (custom shim, not Direct Mode).
- [x] Web smoke checks (3) and TS/TSX syntax transpilation pass.
- [ ] Real GenVM linter/typechecker.
- [ ] Direct Mode and validator-specific GenVM tests.
- [ ] CI install and production frontend build.
- [ ] Signed StudioNet contract deployment on 61999.
- [ ] Real validator assessment with authoritative documents and counterevidence.
- [ ] Full/partial/zero outcome actual GEN flow, refund and payout child transaction confirmation.
- [ ] Public frontend deployment, mobile E2E screenshots and source verification.

**No honest official numerical score can be attached until the actual judging rubric and network proofs exist.**

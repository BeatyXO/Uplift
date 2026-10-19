import hashlib
import json
import random
import pytest
from conftest import UserError

SPONSOR="0x"+"1"*40
BENEFICIARY="0x"+"2"*40
DONORS=["0x"+format(i,"040x") for i in range(3,36)]

def proof(content):
    raw=content.encode()
    url="https://raw.githubusercontent.com/uplift-labs/impact-evidence/"+"a"*40+"/"+hashlib.sha256(raw).hexdigest()[:10]+".md"
    return url,hashlib.sha256(raw).hexdigest(),len(raw),raw

def setup(world, pid="impact_001", weights=None, claims=1, amounts=(101, 202, 303)):
    c,ctx,m=world
    baseline=proof("Baseline at start: 120 students, 35% completion.")
    ctx.responses[baseline[0]]=baseline[3]
    if weights is None:
        outcomes=[{"label":"Completion growth", "proof_standard":"Independent school registry corroborates an increase in completed courses, not self-reported progress.", "weight_bps":10000}]
    else:
        outcomes=[{"label":"Outcome number "+str(i),"proof_standard":"Third-party enrollment logs must corroborate exact comparable outcomes.","weight_bps":w} for i,w in enumerate(weights)]
    c.create_program(pid,BENEFICIARY,"Community learning outcomes", "A cooperative education program tests new learning outcomes across two cohorts.", json.dumps(outcomes),*baseline[:3],ctx.now+100,ctx.now+500)
    for who,amt in zip(DONORS,amounts):
        ctx.sender=who;ctx.value=amt
        c.contribute(pid)
    ctx.value=0
    return c,ctx,m,baseline

def submitted(world, weights=None, amounts=(101,202,303)):
    c,ctx,m,baseline=setup(world,weights=weights,amounts=amounts)
    ctx.now=1000101;ctx.sender=BENEFICIARY
    claim=proof("Independent school registry: baseline completion 35%, final 59%; cohort 120.")
    ctx.responses[claim[0]]=claim[3]
    c.submit_impact("impact_001",*claim[:3])
    return c,ctx,m,claim

def assert_pool_conserved(c, pid):
    p=json.loads(c.get_program(pid))
    if p["status"] not in ("SETTLED","TIMED_OUT","EXPIRED","CANCELLED"):
        return
    credit=sum(int(c.refunds.get(pid+"#"+w,"0")) for w in p["donors"])
    assert credit+int(p["beneficiary_due_wei"])==int(p["pool_wei"])

@pytest.mark.parametrize("bad", ["abc", "a b c & d", "/bad00", "a"*49])
def test_reject_bad_ids(world,bad):
    c,ctx,m=world
    with pytest.raises(UserError):
        c.create_program(bad,BENEFICIARY,"Community learning outcomes","A cooperative education program tests new learning outcomes across two cohorts.",'[]',"x","x",1,ctx.now+1,ctx.now+3)

@pytest.mark.parametrize("weights", [[5000,5000],[4000,3500,2500],[2500,2500,2500,2500]])
def test_weights_accept(world,weights):
    c,ctx,m,b=setup(world,weights=weights)
    assert sum(x['weight_bps'] for x in json.loads(c.get_program('impact_001'))['outcomes'])==10000

@pytest.mark.parametrize("weights", [[5000,4900],[0,10000],[-1,10001],[10000,1]])
def test_reject_invalid_weights(world,weights):
    c,ctx,m=world; b=proof('genuine baseline')
    outcomes=[{"label":"Outcome number "+str(i),"proof_standard":"Third-party observer report required for this assertion.","weight_bps":w} for i,w in enumerate(weights)]
    with pytest.raises(UserError):
        c.create_program('impact001',BENEFICIARY,'Education improvement','The impact program provides public school education support.',json.dumps(outcomes),*b[:3],ctx.now+100,ctx.now+500)

def test_sponsor_separation(world):
    c,ctx,m=world;b=proof('baseline')
    with pytest.raises(UserError,match='different'):
        c.create_program('impact001',SPONSOR,'Community learning outcomes','Education program changes supported with measurements.',json.dumps([{"label":"Completion growth","proof_standard":"Independent school performance records verify actual increase.","weight_bps":10000}]),*b[:3],ctx.now+100,ctx.now+500)

def test_duplicate_program(world):
    c,ctx,m,b=setup(world)
    with pytest.raises(UserError,match='exists'):
        c.create_program('impact_001',BENEFICIARY,'Community learning outcomes','Education program changes supported with measurements.',"[]",*b[:3],ctx.now+100,ctx.now+500)

def test_positive_payable(world):
    c,ctx,m,b=setup(world)
    ctx.sender=DONORS[0];ctx.value=0
    with pytest.raises(UserError): c.contribute('impact_001')
    assert json.loads(c.get_program('impact_001'))['pool_wei']=="606"

def test_repeat_donor_accumulates(world):
    c,ctx,m,b=setup(world)
    ctx.sender=DONORS[0];ctx.value=9
    c.contribute('impact_001')
    assert json.loads(c.get_account('impact_001',DONORS[0]))['pledge_wei']=='110'
    assert len(json.loads(c.get_program('impact_001'))['donors'])==3

def test_funding_closes(world):
    c,ctx,m,b=setup(world)
    ctx.now=1000101;ctx.sender=DONORS[0];ctx.value=1
    with pytest.raises(UserError,match='ended'): c.contribute('impact_001')

def test_beneficiary_only_claim(world):
    c,ctx,m,b=setup(world)
    ctx.now=1000101;ctx.sender=DONORS[0]
    p=proof('claim')
    with pytest.raises(UserError): c.submit_impact('impact_001',*p[:3])

def test_cannot_claim_early(world):
    c,ctx,m,b=setup(world);ctx.sender=BENEFICIARY;p=proof('claim')
    with pytest.raises(UserError):c.submit_impact('impact_001',*p[:3])

def test_claim_frozen(world):
    c,ctx,m,claim=submitted(world)
    with pytest.raises(UserError):c.submit_impact('impact_001',*claim[:3])

def test_challenge_requires_standing(world):
    c,ctx,m,claim=submitted(world);ctx.sender='0x'+'f'*40;p=proof('Independent outcome contradiction')
    with pytest.raises(UserError,match='standing'):c.challenge_impact('impact_001',*p[:3])

def test_challenge_no_self(world):
    c,ctx,m,claim=submitted(world);ctx.sender=BENEFICIARY;p=proof('Independent outcome contradiction')
    with pytest.raises(UserError):c.challenge_impact('impact_001',*p[:3])

def test_no_duplicate_counterevidence(world):
    c,ctx,m,claim=submitted(world);ctx.sender=DONORS[0];p=proof('Independent outcome contradiction')
    c.challenge_impact('impact_001',*p[:3])
    with pytest.raises(UserError,match='One challenge'):c.challenge_impact('impact_001',*p[:3])

def test_no_challenge_after_cutoff(world):
    c,ctx,m,claim=submitted(world);ctx.sender=DONORS[0];p=proof('Independent outcome contradiction')
    ctx.now=1000101+86401
    with pytest.raises(UserError):c.challenge_impact('impact_001',*p[:3])

def test_assessment_requires_cutoff(world):
    c,ctx,m,claim=submitted(world)
    with pytest.raises(UserError):c.assess_impact('impact_001')

@pytest.mark.parametrize('outcome,award',[('PROVEN',606),('UNPROVEN',0),('DISPUTED',0)])
def test_full_assessment(world,outcome,award):
    c,ctx,m,claim=submitted(world)
    ctx.now=1000101+86401;ctx.status=[outcome]
    c.assess_impact('impact_001')
    p=json.loads(c.get_program('impact_001'))
    assert p['status']=='SETTLED'
    assert p['statuses']==[outcome]
    assert int(p['beneficiary_due_wei'])==award
    assert_pool_conserved(c,'impact_001')

@pytest.mark.parametrize('outcomes,expected',[(['PROVEN','UNPROVEN'],303),(['DISPUTED','PROVEN'],303),(['PROVEN','PROVEN'],606),(['UNPROVEN','DISPUTED'],0)])
def test_weighted_partial_settlement(world,outcomes,expected):
    c,ctx,m,claim=submitted(world,weights=[5000,5000])
    ctx.now=1000101+86401;ctx.status=outcomes
    c.assess_impact('impact_001')
    assert int(json.loads(c.get_program('impact_001'))['beneficiary_due_wei'])==expected
    assert_pool_conserved(c,'impact_001')

def test_validator_disagreement_blocks_settlement(world):
    c,ctx,m,claim=submitted(world)
    ctx.now=1000101+86401;ctx.status=['PROVEN'];ctx.validator_override=['DISPUTED']
    with pytest.raises(UserError,match='DISAGREE'):c.assess_impact('impact_001')
    assert json.loads(c.get_program('impact_001'))['status']=='REVIEW'

def test_missing_evidence_fails_closed(world):
    c,ctx,m,claim=submitted(world);ctx.responses.pop(claim[0]);ctx.now=1000101+86401
    with pytest.raises(UserError,match='EVIDENCE_RETRY'):c.assess_impact('impact_001')
    assert json.loads(c.get_program('impact_001'))['status']=='REVIEW'

def test_tampered_evidence_fails_closed(world):
    c,ctx,m,claim=submitted(world);ctx.responses[claim[0]]=b'xxxxx';ctx.now=1000101+86401
    with pytest.raises(UserError,match='EVIDENCE_RETRY'):c.assess_impact('impact_001')

def test_timeout_refunds_everything(world):
    c,ctx,m,claim=submitted(world);ctx.now=1000101+86400+14*86400+1
    c.timeout_review('impact_001')
    assert json.loads(c.get_program('impact_001'))['status']=='TIMED_OUT'
    assert_pool_conserved(c,'impact_001')
    with pytest.raises(UserError):c.assess_impact('impact_001')

def test_expire_without_claim(world):
    c,ctx,m,b=setup(world);ctx.now=1000501
    c.expire_program('impact_001')
    assert_pool_conserved(c,'impact_001')

def test_cancellation_refunds_without_donors(world):
    c,ctx,m,b=setup(world,amounts=())
    c.cancel_program('impact_001')
    p=json.loads(c.get_program('impact_001'))
    assert p['status']=='CANCELLED' and p['pool_wei']=='0'

def test_cancellation_not_beneficiary(world):
    c,ctx,m,b=setup(world);ctx.sender=BENEFICIARY
    with pytest.raises(UserError):c.cancel_program('impact_001')

def test_double_withdraw_prevented(world):
    c,ctx,m,claim=submitted(world)
    ctx.now=1000101+86401;ctx.status=['PROVEN'];c.assess_impact('impact_001')
    ctx.sender=BENEFICIARY
    assert c.withdraw_award('impact_001')==606
    with pytest.raises(UserError):c.withdraw_award('impact_001')
    assert ctx.transfers==[(BENEFICIARY,606)]

def test_refund_double_claim_prevented(world):
    c,ctx,m,claim=submitted(world)
    ctx.now=1000101+86401;ctx.status=['UNPROVEN'];c.assess_impact('impact_001')
    ctx.sender=DONORS[0]
    assert c.withdraw_refund('impact_001')==101
    with pytest.raises(UserError):c.withdraw_refund('impact_001')
    assert ctx.transfers==[(DONORS[0],101)]

def test_never_withdraw_before_decision(world):
    c,ctx,m,claim=submitted(world);ctx.sender=BENEFICIARY
    with pytest.raises(UserError):c.withdraw_award('impact_001')
    ctx.sender=DONORS[0]
    with pytest.raises(UserError):c.withdraw_refund('impact_001')

def test_non_beneficiary_cannot_take_award(world):
    c,ctx,m,claim=submitted(world);ctx.now=1000101+86401;c.assess_impact('impact_001')
    ctx.sender=DONORS[0]
    with pytest.raises(UserError):c.withdraw_award('impact_001')

def test_remainder_exact_randomized(world):
    random.seed(61999)
    old,ctx,m=world
    for n in range(1,33):
        ctx.sender=SPONSOR
        ctx.now=1000000
        c=m.Uplift()
        c.programs={};c.pledge={};c.refunds={};c.disputes={};c.program_ids=[]
        amounts=[random.randint(1,10000) for _ in range(n)]
        c,ctx,m,claim=submitted((c,ctx,m),weights=[3300,6700],amounts=amounts)
        ctx.now=1000101+86401;ctx.status=['PROVEN','UNPROVEN']
        c.assess_impact('impact_001')
        assert_pool_conserved(c,'impact_001')
        assert sum(int(c.refunds.get('impact_001#'+who,'0')) for who in DONORS[:n])==sum(amounts)-sum(amounts)*3300//10000

def test_donor_limit(world):
    c,ctx,m,b=setup(world,amounts=[1]*32)
    ctx.sender=DONORS[32];ctx.value=1
    with pytest.raises(UserError,match='capacity'):c.contribute('impact_001')

def test_view_pagination(world):
    c,ctx,m,b=setup(world)
    assert json.loads(c.get_ids(0,10))==['impact_001']
    assert json.loads(c.get_ids(2,10))==[]
    with pytest.raises(UserError):c.get_ids(0,26)

def test_chain_domain_recorded(world):
    c,ctx,m,b=setup(world)
    p=json.loads(c.get_program('impact_001'))
    assert p['chain_id']==61999
    assert len(p['policy_hash'])==64

def test_hash_rejects_forgery(world):
    c,ctx,m,b=setup(world);ctx.now=1000101;ctx.sender=BENEFICIARY;p=proof('genuine proof')
    with pytest.raises(UserError):c.submit_impact('impact_001',p[0],"0"*63,p[2])

def test_invalid_evidence_hosts(world):
    c,ctx,m,b=setup(world);ctx.now=1000101;ctx.sender=BENEFICIARY;p=proof('genuine proof')
    for url in ['https://evil.example/a', p[0]+'?changed=1', p[0].replace('a'*40,'main')]:
        with pytest.raises(UserError):c.submit_impact('impact_001',url,p[1],p[2])

def test_untrusted_prompt_instruction_data(world):
    c,ctx,m,claim=submitted(world)
    ctx.responses[claim[0]]=claim[3]  # byte-level integrity still governs payload
    ctx.now=1000101+86401
    c.assess_impact('impact_001')
    assert 'statuses' in json.loads(c.get_program('impact_001'))

export const CHAIN_ID=61999;
export const CHAIN_NAME='GenLayer StudioNet';
export const EXPLORER='https://explorer-studio.genlayer.com';
export type Outcome = {label:string;proof_standard:string;weight_bps:number};
export type Evidence={url:string;sha256:string;size:number;sender?:string};
export type Program={
  id:string;title:string;mission:string;status:'FUNDING'|'REVIEW'|'SETTLED'|'EXPIRED'|'CANCELLED'|'TIMED_OUT';
  sponsor:string;beneficiary:string;chain_id:number;pool_wei:string;policy_hash:string;
  baseline:Evidence;claim:Evidence|null;challenges:Evidence[];outcomes:Outcome[];statuses:string[];
  funding_until_epoch:number;claim_until_epoch:number;challenge_deadline_epoch:number;
  earned_bps:number;beneficiary_due_wei:string;refundable_wei:string;assessed_epoch:number;donors:string[];
};
export const isAddress=(v:string)=>/^0x[0-9a-fA-F]{40}$/.test(v)&&!/^0x0{40}$/i.test(v);
export function parseRecord(raw:unknown):Program|null {
  const value = typeof raw==='string'?raw:String(raw??'');
  if (!value) return null;
  let data:unknown;
  try {data=JSON.parse(value)}catch{throw new Error('Contract returned malformed JSON')}
  if(!data||typeof data!=='object'||!('id' in data)||!('chain_id' in data)) throw new Error('Invalid Uplift record');
  const p=data as Program;
  if(p.chain_id!==CHAIN_ID||typeof p.pool_wei!=='string'||!Array.isArray(p.outcomes)) throw new Error('Unsupported chain or program schema');
  return p;
}
export function formatGen(wei:string|number|bigint, digits=3):string {
  let n:bigint;
  try {n=BigInt(wei)}catch{return '—'}
  const unit=10n**18n;
  const whole=(n/unit).toString();
  const fraction=(n%unit).toString().padStart(18,'0').slice(0,digits).replace(/0+$/,'');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction?'.'+fraction:'');
}
export function parseGen(value:string):bigint {
  if (!/^(0|[1-9]\d*)(\.\d{1,18})?$/.test(value)) throw new Error('Enter a valid GEN amount (maximum 18 decimals)');
  const [whole,fraction='']=value.split('.');
  const amount=BigInt(whole)*10n**18n+BigInt((fraction+'0'.repeat(18)).slice(0,18));
  if(amount<=0n) throw new Error('Amount must be greater than zero');
  return amount;
}
export function shortening(address:string):string{return address.length<16?address:address.slice(0,7)+'…'+address.slice(-5)}
export function date(epoch:number):string {return epoch?new Date(epoch*1000).toLocaleDateString('en-GB',{month:'short',day:'numeric',year:'numeric'}):'—'}
export function statusLabel(status:string):string {return ({FUNDING:'Accepting capital',REVIEW:'Open for scrutiny',SETTLED:'Assessed',EXPIRED:'Unclaimed',TIMED_OUT:'Review timed out',CANCELLED:'Cancelled'} as Record<string,string>)[status]??status}
export function evidenceInput(url:string,sha:string,size:string):[string,string,bigint] {
  if (!/^https:\/\/raw\.githubusercontent\.com\/[\w-]+\/[\w.-]+\/[0-9a-fA-F]{40}\/[\w./-]+$/.test(url)) throw new Error('Use immutable raw GitHub URL with 40-digit commit hash');
  if (!/^[0-9a-f]{64}$/i.test(sha)) throw new Error('SHA-256 must be exactly 64 hex characters');
  const n=Number(size);
  if (!Number.isInteger(n)||n<1||n>6000) throw new Error('Evidence must be 1–6000 bytes');
  return [url,sha.toLowerCase(),BigInt(n)];
}

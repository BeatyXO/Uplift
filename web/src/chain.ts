import {createClient} from 'genlayer-js';
import {ExecutionResult, TransactionStatus} from 'genlayer-js/types';
import {studionet} from 'genlayer-js/chains';
import {isAddress,parseRecord,type Program} from './protocol';

import {assertStudioNet, getWalletProvider} from './wallet';

export type ChainAction = {method:string;args:(string|bigint)[];value?:bigint};
const readClient=createClient({chain:studionet});

export function getContract():string {
  const fromEnv=(import.meta.env.VITE_UPLIFT_CONTRACT_ADDRESS||'').trim();
  const fromSession=typeof window!=='undefined'?window.localStorage.getItem('uplift.contract')||'':'';
  const address=fromEnv||fromSession;
  if(!isAddress(address)) throw new Error('Configure a deployed Uplift contract address to use real chain data');
  return address;
}
export function saveContract(value:string){
  if(!isAddress(value)) throw new Error('Provide a valid non-zero 0x contract address');
  window.localStorage.setItem('uplift.contract',value);
}
export async function fetchPrograms():Promise<Program[]> {
  const address=getContract() as `0x${string}`;
  const count=Number(await readClient.readContract({address,functionName:'get_count',args:[]}));
  if(!Number.isSafeInteger(count)||count<0) throw new Error('Invalid on-chain program count');
  const list:Program[]=[];
  // Bounded pagination, including when the chain has many records.
  for(let offset=0;offset<Math.min(count,200);offset+=25){
    const raw=await readClient.readContract({address,functionName:'get_ids',args:[BigInt(offset),25n]});
    const ids=JSON.parse(String(raw)) as string[];
    if(!Array.isArray(ids)||ids.length>25) throw new Error('Invalid on-chain program index');
    const rows=await Promise.all(ids.map(async id=>parseRecord(await readClient.readContract({address,functionName:'get_program',args:[id]}))));
    for(const row of rows) if(row) list.push(row);
    // Large registries show the first 200 records, rather than failing closed.
  }
  return list;
}
export async function fetchAccount(id:string,wallet:string):Promise<{pledge_wei:string;refund_due_wei:string}> {
  const address=getContract() as `0x${string}`;
  const data=await readClient.readContract({address,functionName:'get_account',args:[id,wallet]});
  return JSON.parse(String(data));
}
export async function fetchRecoveredPayout(wallet:string):Promise<string> {
  const address=getContract() as `0x${string}`;
  return String(await readClient.readContract({address,functionName:'get_recovered_payout',args:[wallet]}));
}
export async function connectWallet():Promise<string>{
  const provider=getWalletProvider();
  if(!provider) throw new Error('Install an EIP-1193 wallet to connect');
  const accounts=await provider.request({method:'eth_requestAccounts'});
  const wallet=Array.isArray(accounts)?accounts[0]:undefined;
  if(typeof wallet!=='string'||!isAddress(wallet))throw new Error('Wallet did not return a valid address');
  // Preserve consent, not a fake wallet connection. Refresh uses eth_accounts without prompting.
  window.localStorage.setItem('uplift.wallet.optin','yes');
  return wallet;
}
export async function sendTransaction(wallet:string, action:ChainAction,onSubmitted:(hash:string)=>void):Promise<string>{
  const provider=getWalletProvider();
  if(!provider)throw new Error('No browser wallet found');
  if(!isAddress(wallet))throw new Error('Connect a wallet first');
  await assertStudioNet(provider);
  const accounts=await provider.request({method:'eth_accounts'});
  if(!Array.isArray(accounts)||!accounts.some(a=>typeof a==='string'&&a.toLowerCase()===wallet.toLowerCase())) throw new Error('Active wallet changed. Reconnect before signing');
  const client=createClient({chain:studionet,account:wallet as `0x${string}`,provider});
  await client.connect('studionet');
  const write={address:getContract() as `0x${string}`,functionName:action.method,args:action.args,value:action.value??0n};
  const hash=await client.writeContract(write);
  onSubmitted(hash);
  const result=await client.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED});
  if(result.statusName!==TransactionStatus.FINALIZED||result.txExecutionResultName!==ExecutionResult.FINISHED_WITH_RETURN)throw new Error(`Transaction ${hash} finalized without successful execution; inspect explorer before retrying`);
  return hash;
}

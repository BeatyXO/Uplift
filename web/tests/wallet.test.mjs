import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeChainId,STUDIO_CHAIN_HEX,STUDIO_CHAIN_ID,STORAGE_KEY,restoreWallet,disconnectWallet,getInjectedChain,assertStudioNet,switchToStudioNet} from '../src/wallet.ts';

const a='0x1234567890abcdef1234567890abcdef12345678';
function storage(remembered){const map=new Map(remembered?[[STORAGE_KEY,'yes']]:[]);return {getItem:key=>map.get(key)??null,removeItem:key=>map.delete(key),setItem:(key,val)=>map.set(key,val)};}
function provider(options={}){const methods=[];let chain=options.chain??'0xf22f';return {methods,request:async ({method,params})=>{methods.push({method,params});if(method==='eth_accounts')return options.accounts??[a];if(method==='eth_chainId')return chain;if(method==='wallet_switchEthereumChain'){if(options.errorOnce&&!options.failed){options.failed=true;throw {code:4902}}chain=params[0].chainId;return null;}if(method==='wallet_addEthereumChain')return null;throw Error('Unexpected method '+method)}};}

test('hex chain id is exact 61999',()=>{assert.equal(STUDIO_CHAIN_HEX,'0xf22f');assert.equal(STUDIO_CHAIN_ID,61999);assert.equal(normalizeChainId('0xf22f'),61999);assert.equal(normalizeChainId('61999'),null);assert.equal(normalizeChainId({}),null)});
test('restore authorized wallet without prompting',async()=>{const p=provider();const result=await restoreWallet(p,storage(true));assert.equal(result,a);assert.deepEqual(p.methods.map(m=>m.method),['eth_accounts'])});
test('do not restore when user disconnected',async()=>{const p=provider();assert.equal(await restoreWallet(p,storage(false)),null);assert.equal(p.methods.length,0)});
test('restore gracefully if extension has revoked permissions',async()=>{assert.equal(await restoreWallet(provider({accounts:[]}),storage(true)),null)});
test('reject zero and malformed accounts on restore',async()=>{for(const bad of ['0x'+'0'.repeat(40),'not-address'])assert.equal(await restoreWallet(provider({accounts:[bad]}),storage(true)),null)});
test('disconnect clears only Uplift opt-in state',()=>{const s=storage(true);disconnectWallet(s);assert.equal(s.getItem(STORAGE_KEY),null)});
test('read chain id from injected wallet',async()=>{assert.equal(await getInjectedChain(provider()),61999)});
test('writing requires correct network',async()=>{await assert.rejects(assertStudioNet(provider({chain:'0x1'})),/Wrong network/);await assert.doesNotReject(assertStudioNet(provider()))});
test('switch on chain already registered',async()=>{const p=provider({chain:'0x1'});await switchToStudioNet(p);assert.deepEqual(p.methods.map(x=>x.method),['wallet_switchEthereumChain','eth_chainId'])});
test('install unknown chain 4902 and re-switch',async()=>{const p=provider({chain:'0x1',errorOnce:true});await switchToStudioNet(p);const m=p.methods.map(x=>x.method);assert.deepEqual(m,['wallet_switchEthereumChain','wallet_addEthereumChain','wallet_switchEthereumChain','eth_chainId']);assert.equal(p.methods[1].params[0].chainId,'0xf22f');assert.equal(p.methods[1].params[0].nativeCurrency.symbol,'GEN')});
test('wallet rejection is passed through; no silent retry',async()=>{const p={request:async()=>{throw {code:4001,message:'User rejected'}}};await assert.rejects(switchToStudioNet(p),e=>e.code===4001)});

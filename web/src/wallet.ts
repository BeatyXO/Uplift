/** EIP-1193 injected wallet boundary; never stores private keys. */
export const STUDIO_CHAIN_ID=61999;
export const STUDIO_CHAIN_HEX='0xf22f';
const STUDIO_RPC='https://studio.genlayer.com/api';
const STUDIO_EXPLORER='https://explorer-studio.genlayer.com';
export const STORAGE_KEY='uplift.wallet.optin';
export type WalletProvider={
  request:(args:{method:string;params?:unknown[]})=>Promise<unknown>;
  on?:(event:string,handler:(value:unknown)=>void)=>void;
  removeListener?:(event:string,handler:(value:unknown)=>void)=>void;
};
declare global {interface Window {ethereum?:WalletProvider}}
export const getWalletProvider=():WalletProvider|undefined=>typeof window==='undefined'?undefined:window.ethereum;
export function normalizeChainId(value:unknown):number|null{
  if(typeof value!=='string'||!/^0x[0-9a-f]+$/i.test(value))return null;
  const n=Number.parseInt(value,16);
  return Number.isSafeInteger(n)?n:null;
}
export async function getInjectedChain(provider:WalletProvider):Promise<number|null>{
  return normalizeChainId(await provider.request({method:'eth_chainId'}));
}
export async function assertStudioNet(provider:WalletProvider):Promise<void>{
  if(await getInjectedChain(provider)!==STUDIO_CHAIN_ID)throw new Error('Wrong network. Switch your wallet to GenLayer StudioNet (61999) before signing');
}
export async function switchToStudioNet(provider:WalletProvider):Promise<void>{
  try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:STUDIO_CHAIN_HEX}]});}
  catch(error){
    const e=error as {code?:number;data?:{originalError?:{code?:number}}};
    if(e?.code!==4902&&e?.data?.originalError?.code!==4902)throw error;
    await provider.request({method:'wallet_addEthereumChain',params:[{
      chainId:STUDIO_CHAIN_HEX,chainName:'GenLayer StudioNet',nativeCurrency:{name:'GEN',symbol:'GEN',decimals:18},
      rpcUrls:[STUDIO_RPC],blockExplorerUrls:[STUDIO_EXPLORER]
    }]});
    // Wallet add does not guarantee switch. Explicitly ask after adding.
    await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:STUDIO_CHAIN_HEX}]});
  }
  await assertStudioNet(provider);
}
export async function restoreWallet(provider:WalletProvider|undefined, storage:{getItem:(key:string)=>string|null}):Promise<string|null>{
  if(!provider||storage.getItem(STORAGE_KEY)!=='yes')return null;
  const accounts=await provider.request({method:'eth_accounts'});
  if(!Array.isArray(accounts))return null;
  const candidate=accounts[0];
  return typeof candidate==='string'&&/^0x[0-9a-fA-F]{40}$/.test(candidate)&&!/^0x0{40}$/i.test(candidate)?candidate:null;
}
export function disconnectWallet(storage:{removeItem:(key:string)=>void}){storage.removeItem(STORAGE_KEY)}

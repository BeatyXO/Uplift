/** Preflight for public pinned UTF-8 evidence; verification is repeated by GenLayer validators. */
export const IMMUTABLE_RAW=/^https:\/\/raw\.githubusercontent\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\/[0-9a-fA-F]{40}\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/;
export const EVIDENCE_LIMIT=6000;
export function verifyPinnedUrl(url:string):void{
  if(!IMMUTABLE_RAW.test(url)||url.includes('/../')||url.includes('/./'))throw new Error('Only commit-pinned raw.githubusercontent.com URLs with safe paths are accepted');
}
export async function inspectPinnedEvidence(url:string, fetcher:typeof fetch=fetch):Promise<{url:string;sha256:string;size:number}>{
  verifyPinnedUrl(url);
  const response=await fetcher(url,{method:'GET',redirect:'error',cache:'no-store'});
  if(!response.ok||!response.body)throw new Error('The pinned evidence is not publicly readable');
  const len=response.headers.get('content-length');
  if(len&&Number(len)>EVIDENCE_LIMIT)throw new Error('Evidence exceeds 6000 bytes');
  const reader=response.body.getReader();
  const chunks:Uint8Array[]=[];let size=0;
  try{
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>EVIDENCE_LIMIT)throw new Error('Evidence exceeds 6000 bytes');chunks.push(value)}
  }finally{await reader.cancel().catch(()=>{})}
  if(size===0)throw new Error('Evidence is empty');
  const bytes=new Uint8Array(size);let offset=0;
  for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength}
  const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if(!text.trim())throw new Error('Evidence is blank');
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  const sha256=Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
  return {url,sha256,size};
}

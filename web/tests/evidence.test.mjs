import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyPinnedUrl,inspectPinnedEvidence} from '../src/evidence.ts';
const url='https://raw.githubusercontent.com/example/impact/'+ 'a'.repeat(40)+'/baseline/report.md';
const f=body=>async()=>new Response(body,{headers:{'content-length':String(new TextEncoder().encode(body).byteLength)}});
test('accept commit pinned GitHub raw link',()=>{assert.doesNotThrow(()=>verifyPinnedUrl(url))});
test('block mutable branches, queries, fragments, escaping, and hosts',()=>{
 for(const suspect of [url.replace('a'.repeat(40),'main'),url+'?x=1',url+'#x',url.replace('raw.githubusercontent.com','evil.com'),url.replace('/baseline/report.md','/../report.md')])assert.throws(()=>verifyPinnedUrl(suspect))
});
test('compute exact UTF8 SHA-256 and byte count',async()=>{const res=await inspectPinnedEvidence(url,f('Hello, GenLayer!\n'));assert.equal(res.size,17);assert.equal(res.sha256,'108476097ee460563d88557be55943f9645ca1c88491a7661877152d03c4fc42')});
test('no empty or whitespace evidence',async()=>{await assert.rejects(inspectPinnedEvidence(url,f('  \n ')),/blank/)});
test('evidence cannot be over 6000 bytes',async()=>{await assert.rejects(inspectPinnedEvidence(url,f('x'.repeat(6001))),/6000/)});
test('reject HTTP errors',async()=>{await assert.rejects(inspectPinnedEvidence(url,async()=>new Response('Not found',{status:404})),/not publicly readable/)});
test('reject invalid UTF8 byte sequences',async()=>{await assert.rejects(inspectPinnedEvidence(url,async()=>new Response(Uint8Array.of(0xff))),/encoded|valid|utf-8|UTF-8/i)});

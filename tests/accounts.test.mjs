import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordHash,passwordMatches,avatarType} from '../server/index.mjs';

test('senha usa hash derivado e valida sem armazenar texto puro',async()=>{
 const salt='salt-seguro-de-teste';
 const hash=await passwordHash('senha-muito-segura',salt,1000);
 assert.notEqual(hash,'senha-muito-segura');
 assert.equal(hash.length,64);
 assert.equal(await passwordMatches('senha-muito-segura',salt,await passwordHash('senha-muito-segura',salt)),true);
 assert.equal(await passwordMatches('senha-errada',salt,await passwordHash('senha-muito-segura',salt)),false);
});

test('avatar exige MIME coerente com a assinatura do arquivo',()=>{
 assert.equal(avatarType(Uint8Array.from([255,216,255,1]).buffer,'image/jpeg'),'image/jpeg');
 assert.equal(avatarType(Uint8Array.from([137,80,78,71,13,10,26,10]).buffer,'image/png'),'image/png');
 assert.equal(avatarType(new TextEncoder().encode('RIFFxxxxWEBP').buffer,'image/webp'),'image/webp');
 assert.equal(avatarType(Uint8Array.from([137,80,78,71,13,10,26,10]).buffer,'image/jpeg'),null);
 assert.equal(avatarType(new TextEncoder().encode('<script>').buffer,'image/png'),null);
});

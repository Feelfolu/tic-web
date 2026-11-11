// Boundary and eligibility regressions for the browser calendar scripts.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
function read(file, exports) {
 const ctx = {Intl, Date, URL, window: {setInterval() {}, setTimeout() {}}, document: {readyState:'loading', addEventListener() {}}};
 let src = fs.readFileSync(file, 'utf8').replace('  function init() {', `  window.test = {${exports}};\n  function init() {`);
 vm.runInNewContext(src, ctx); return ctx.window.test;
}
const c = read('assets/kiirasok.js', 'state,visibleCalls,dateValue,card,T');
const ev = read('assets/esemenyek.js', 'visible,dateValue');
const at = s => new Date(s);
const base = {status:'open', deadlines:['2027-01-11T14:00:00+01:00'],langs:['hu','ro','en'],title:{hu:'Teszt',ro:'Test',en:'Test'}};
assert.equal(c.state(base, at('2027-01-11T12:59:59Z')).kind, 'open');
assert.equal(c.state(base, at('2027-01-11T13:00:00Z')).kind, 'closed');
assert.equal(c.state(base, at('2027-01-13T12:59:59Z')).kind, 'closed');
assert.equal(c.state(base, at('2027-01-13T13:00:00Z')), null);
const future = {...base,status:'expected',opensAt:'2026-12-01T12:00:00+02:00',openingConfirmed:true};
assert.equal(c.state(future, at('2026-12-01T09:59:59Z')).kind, 'expected');
assert.equal(c.state(future, at('2026-12-01T10:00:00Z')).kind, 'open');
assert.equal(c.state({...future,openingConfirmed:false},at('2026-11-11')),null);
assert.equal(c.state({...base,publication:'excluded'},at('2026-11-11')),null);
assert.equal(c.state({...base,publication:'review'},at('2026-11-11')),null);
assert.equal(c.state({...base,status:'withdrawn'},at('2026-11-11')),null);
assert.equal(c.state({...base,stages:[{deadline:'2027-06-16T14:00:00+02:00',invitationOnly:true}]},at('2027-06-01')),null);
assert.equal(c.state({...base,deadlines:['2027-01-11T14:00:00+01:00','2027-02-11T14:00:00+01:00']},at('2027-01-12')).kind,'open');
assert.equal(c.state({...base,deadlines:[],rolling:true},at('2026-11-11')).kind,'open');
assert.equal(c.dateValue('2027-03-28','Europe/Bucharest',true).toISOString(),'2027-03-28T21:00:00.000Z');
assert.equal(c.dateValue('2027-10-31','Europe/Bucharest',true).toISOString(),'2027-10-31T22:00:00.000Z');
assert.equal(ev.visible({start:'2026-11-17T14:00:00+01:00',end:'2026-11-17T16:00:00+01:00'},at('2026-11-19T14:59:59Z')),true);
assert.equal(ev.visible({start:'2026-11-17T14:00:00+01:00',end:'2026-11-17T16:00:00+01:00'},at('2026-11-19T15:00:00Z')),false);
const data = JSON.parse(fs.readFileSync('data/kiirasok.json'));
assert.equal(new Set(data.calls.map(x=>x.id)).size,data.calls.length);
const events = JSON.parse(fs.readFileSync('data/esemenyek.json'));
assert.equal(new Set(events.events.map(x=>x.id)).size,events.events.length);
for (const item of [...data.calls,...events.events]) {
 if(item.publication==='review'||item.publication==='excluded')continue;
 if((item.tags||[]).includes('hu')) assert.deepEqual(item.langs,['hu']);
 else assert.deepEqual([...item.langs].sort(),['en','hu','ro']);
 for(const lang of item.langs)for(const key of (item.start?['title','organizer','desc']:['title','funder','who']))assert.ok(item[key][lang],`${item.id} ${key} ${lang}`);
}
for(const lang of ['hu','ro','en']) {
 const items=c.visibleCalls(data,lang,at('2026-11-11T16:00:00Z'));
 assert.ok(items.some(x=>x.st.kind==='expected'));
 assert.ok(!items.some(x=>x.call.publication==='excluded'));
 for(const item of items) assert.ok(c.card(item,lang,data).includes('<article'));
 console.log(lang, items.length, 'visible;', items.filter(x=>x.st.kind==='open').slice(0,3).map(x=>x.call.id).join(', '));
}
console.log('Calendar boundary, language, archive and stage checks passed.');

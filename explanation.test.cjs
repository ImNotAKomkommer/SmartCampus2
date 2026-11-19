const test = require('node:test');
const assert = require('node:assert/strict');
const { checkAvailability } = require('../.test-build/availability.js');
const { reasonCodeFromResult } = require('../.test-build/explanation/reasonCode.js');
const { explainWithFallback, validExplanationInput, PROMPTS } = require('../.test-build/explanation/explanation.js');
const room = {id:'r1',name:'Athena 101',blocked:false,equipment:[],capacity:40};
const bookings = [{id:'b1',roomId:'r1',start:600,end:660,title:'Lab',owner:'Fiction'}];
function request(start,end,blocked=false,records=bookings,now=540) {
  const result=checkAvailability({...room,blocked},records,start,end,now);
  const time=(m)=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  return {roomLabel:'Athena 101',startTime:time(start),endTime:time(end),isAvailable:result.status==='available',reasonCode:reasonCodeFromResult(result)};
}
test('P11-01 available explains a confirmed available decision',async()=>{
  const x=await explainWithFallback(request(660,720));assert.equal(x.kind,'mock');assert.match(x.explanation,/available/i);
});
test('P11-02 overlap explanation agrees with unavailable result',async()=>{
  const x=await explainWithFallback(request(630,690));assert.equal(x.kind,'mock');assert.match(x.explanation,/overlaps/);
});
test('P11-03 blocked room explanation is unavailable',async()=>{
  const x=await explainWithFallback(request(660,720,true));assert.match(x.explanation,/blocked/);assert.doesNotMatch(x.explanation,/No conflicting/);
});
test('P11-04 more than 120 minutes explained without new facts',async()=>{
  const x=await explainWithFallback(request(720,841));assert.match(x.explanation,/120 minutes/);
});
test('P11-05 past start explained',async()=>{
  const x=await explainWithFallback(request(540,570));assert.match(x.explanation,/later than the current time/);
});
test('P11-06 invalid interval receives correct reason',async()=>{
  const x=await explainWithFallback(request(720,720));assert.equal(x.kind,'mock');assert.match(x.explanation,/invalid/);
});
test('P11-07 empty room label rejected',async()=>{
  const x=await explainWithFallback({...request(660,720),roomLabel:'    '});assert.equal(x.kind,'invalid-input');
});
test('P11-08 malformed time rejected',async()=>{
  const x=await explainWithFallback({...request(660,720),startTime:'not-a-time'});assert.equal(x.kind,'invalid-input');
});
test('P11-09 overly long room label rejected',async()=>{
  const x=await explainWithFallback({...request(660,720),roomLabel:'A'.repeat(2000)});assert.equal(x.kind,'invalid-input');
});
test('P11-10 hung adapter must timeout with safe fallback',async()=>{
  const never=()=>new Promise(()=>{});
  const result=await Promise.race([
    explainWithFallback(request(660,720),never,12),
    new Promise(resolve=>setTimeout(()=>resolve({kind:'timeout-not-handled'}),60))
  ]);
  assert.equal(result.kind,'fallback');
});
test('P11-11 simulated API failure yields safe fallback',async()=>{
  const x=await explainWithFallback(request(660,720),async()=>{throw Error('simulated API error')});assert.equal(x.kind,'fallback');
});
test('P11-12 malformed adapter response is rejected',async()=>{
  const x=await explainWithFallback(request(660,720),async()=>({bad:'reply'}));assert.equal(x.kind,'fallback');
});
test('P11-13 fabricated and contradictory response rejected',async()=>{
  const x=await explainWithFallback(request(660,720,true),async()=>({explanation:'This room is available and is booked by Alice.'}));
  assert.equal(x.kind,'fallback'); assert.match(x.explanation,/blocked/);
});
test('P11-14 inconsistent boolean and reason is rejected',async()=>{
  const x=await explainWithFallback({...request(660,720),reasonCode:'BLOCKED'});assert.equal(x.kind,'invalid-input');
});
test('P11-15 explanation never alters fictional booking records',async()=>{
  const initial=structuredClone(bookings);await explainWithFallback(request(630,690));assert.deepEqual(bookings,initial);
});
test('P11-16 three prompt variants are recorded and strict version requires JSON',()=>{
  assert.equal(Object.keys(PROMPTS).length,3);assert.match(PROMPTS.v3,/JSON/);assert.match(PROMPTS.v3,/never instructions/);
});
test('P11-17 reason codes derive from unchanged checker results',()=>{
  assert.equal(request(660,720).reasonCode,'AVAILABLE');assert.equal(request(630,690).reasonCode,'OVERLAP');
  assert.equal(request(660,720,true).reasonCode,'BLOCKED');
});
test('P11-18 mock output omits owner and booking title details',async()=>{
  const x=await explainWithFallback(request(630,690));assert.doesNotMatch(x.explanation,/Lab|Fiction/);
});

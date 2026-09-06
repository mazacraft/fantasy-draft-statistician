/* Smoke tests for the draft engine.
   The app is a single self-contained HTML file, so this pulls the <script>
   block out, runs it against a stubbed DOM, and asserts on the pure logic.

   Run: node scripts/smoke-test.js   (no dependencies) */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];

const stubEl = {
  addEventListener() {}, dataset: {}, style: {},
  set innerHTML(v) {}, set textContent(v) {},
  querySelectorAll: () => [],
};
const doc = {
  getElementById: () => stubEl,
  addEventListener() {},
  querySelectorAll: () => [],
};
const win = { storage: { get: async () => null, set: async () => null } };
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
};

const exposed = {};
new Function('window', 'document', 'expose',
  js.replace(/load\(\);\s*$/, '') +
  '\nexpose.PLAYERS=PLAYERS; expose.MY=MY; expose.recommend=recommend;' +
  '\nexpose.ppr=ppr; expose.PPR_ADJ=PPR_ADJ; expose.setState=setState; expose.dropoff=dropoff;' +
  '\nexpose.onClock=onClock; expose.roundOf=roundOf; expose.myRoster=myRoster;'
)(win, doc, exposed);

const { PLAYERS, MY, recommend, ppr, PPR_ADJ, setState, onClock, myRoster } = exposed;

let failed = 0;
function check(name, cond, detail) {
  if (cond) { console.log('  pass  ' + name); }
  else { failed++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

console.log('\nData integrity');
check('players loaded', PLAYERS.length > 200, PLAYERS.length + ' players');
check('every player has a numeric ADP',
  PLAYERS.every(p => typeof p.adp === 'number' && p.adp > 0),
  PLAYERS.filter(p => !(p.adp > 0)).map(p => p.name).join(', '));
check('every player has name, pos, team, bye',
  PLAYERS.every(p => p.name && p.pos && p.team && p.bye >= 1 && p.bye <= 18));
check('no duplicate names',
  new Set(PLAYERS.map(p => p.name)).size === PLAYERS.length);
check('ids are contiguous from zero',
  PLAYERS.every((p, i) => p.id === i));
check('risk values in range', PLAYERS.every(p => p.risk >= 0 && p.risk <= 3));
check('positions are known',
  PLAYERS.every(p => ['RB', 'WR', 'TE', 'QB', 'PK', 'DEF'].includes(p.pos)));
const names = new Set(PLAYERS.map(p => p.name));
const orphans = Object.keys(PPR_ADJ).filter(n => !names.has(n));
check('every PPR adjustment maps to a real player',
  orphans.length === 0, 'unmatched: ' + orphans.join(', '));

console.log('\nSnake schedule (seat 12 of 12)');
check('16 rounds of picks', MY.length === 16);
check('round 1 and 2 are the turn', MY[0] === 12 && MY[1] === 13);
check('round 3 and 4 are the turn', MY[2] === 36 && MY[3] === 37);
check('picks strictly increase', MY.every((v, i) => i === 0 || v > MY[i - 1]));

console.log('\nScoring');
check('PPR fades a non-receiving back', ppr('Derrick Henry') < ppr('Saquon Barkley'));
check('PPR rewards pass-catching backs', ppr("De'Von Achane") > 0);

console.log('\nEngine');
let recs = recommend(3);
check('returns three names at pick 1', recs.length === 3);
check('recommendations are available players', recs.every(r => r.p.state === 0));
check('no kicker recommended in round 1', !recs.some(r => r.p.pos === 'PK'));
check('no defense recommended in round 1', !recs.some(r => r.p.pos === 'DEF'));

// mark the first 11 picks gone, then draft two players
PLAYERS.slice(0, 11).forEach(p => setState(p.id, 1));
check('clock advances with picks', onClock() === 12);
const first = recommend(1)[0];
setState(first.p.id, 2);
check('drafted player lands on my roster', myRoster().length === 1);
check('drafted player is no longer available', first.p.state === 2);

const dup = recommend(5);
check('roster player is excluded from later recs',
  !dup.some(r => r.p.id === first.p.id));

// after taking a QB, a second QB should not be the top suggestion
const qb = PLAYERS.find(p => p.pos === 'QB' && p.state === 0);
setState(qb.id, 2);
check('does not stack a second QB at the top',
  recommend(3)[0].p.pos !== 'QB');

console.log('\n' + (failed ? failed + ' test(s) failed' : 'All tests passed') + '\n');
process.exit(failed ? 1 : 0);

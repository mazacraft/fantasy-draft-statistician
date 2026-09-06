# Fantasy Draft Statistician

A single-file live draft board for a 12-team PPR fantasy football league. Open it on
your phone during the draft, tap players off the board as they go, and it tells you
who to take next and why.

Built for one specific league setup — 12 teams, full PPR, one flex, kickers and D/ST
with return yardage, drafting from the 12th seat.

## What it does

**Recommends by cost of waiting, not by ranking.** A bar across the top shows how much
worse the best available player gets at each position by the time your next pick comes
around. If it reads `RB −4 / WR −22`, the running back cliff already passed and the
real scarcity is at receiver.

**Detects positional runs and tells you whether to chase.** Five running backs in the
last eight picks means something different depending on whether the tier is empty. If
the cliff is still ahead and you're thin, it says take one. If the tier already
emptied, it says let the receivers fall to you instead.

**Adjusts for full PPR.** Public ADP is blended across scoring formats, so it
undervalues pass-catching backs and overvalues touchdown-dependent grinders. Every
player carries a receiving-role adjustment on top of ADP.

**Flags injury risk.** Each player has a 0–3 risk rating and a plain-language note
covering the last two seasons plus current status.

**Tracks your roster.** Starting slots, bench, bye-week collisions among starters, and
a list of contingency backs still on the board.

## Running it

Open `index.html` in a browser. No build step, no dependencies, no server.

To host it, push to GitHub and turn on Pages — the whole app is one static file.

Draft state saves to `localStorage`, so a refresh mid-draft won't lose your board.

## Testing

Requires [Node.js](https://nodejs.org/). Clone the repo and run:

```bash
git clone https://github.com/mazacraft/fantasy-draft-statistician.git
cd fantasy-draft-statistician
node scripts/smoke-test.js
```

No other dependencies. The test extracts the script block from `index.html`, runs it
against a stubbed DOM, and asserts on the pure logic: data integrity across all players,
the snake pick schedule for seat 12, the PPR adjustment table, and engine behavior
(availability, no kicker in round one, no stacking a second quarterback).

## Adapting it to your league

Everything worth changing sits at the top of the script block in `index.html`.

- **`RAW`** — the player pool. Each row is
  `[name, position, team, bye, adp, risk, note, isContingencyBack]`.
- **`MY`** — your pick numbers. Change the seat by editing the loop; the formula for
  seat *s* in a 12-team snake is `(r-1)*12 + s` on odd rounds and
  `(r-1)*12 + (13-s)` on even ones.
- **`PPR_ADJ`** — per-player receiving-role adjustment, in ADP-equivalent spots.
- **`needScore()`** — roster construction targets by round.
- **`RISK_PEN`** — how hard each injury tier gets discounted.

For half-PPR or standard scoring, shrink or zero out `PPR_ADJ`.

## A note on the data

ADP comes from 12-team PPR mock drafts run between August 29 and September 5, 2026.
Injury notes reflect reporting through the morning of September 6, 2026. Both go stale
fast — re-check anything time-sensitive before you draft.

The risk ratings and PPR adjustments are editorial judgment layered on top of market
consensus, not the output of a projection model. The ADP is displayed next to every
player so you can overrule any of it.

## License

MIT

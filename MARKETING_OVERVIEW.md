# DEVLIFE — Game Overview for Marketing

*A working reference for anyone promoting the game who doesn't read code. Written from the current live build (Sept 2026).*

---

## 1. The 10-second pitch

**DEVLIFE is BitLife, but you're building an AI company instead of just living a life.**

You're a founder. You start with a rented GPU and an idea. Every year brings a handful of decisions — some about your AI (do you publish the weights? do you run the shutdown drill?), some about your actual life (do you ask for a raise? do you propose?). The game tracks both at once, and they collide: a burnout is a burnout whether it's caused by a funding crisis or a bad breakup.

The tagline in current use: **"Build the AI. Build the empire. Try to keep a life."**

The dramatic thesis, straight from the README: *"Somewhere ahead is a system more capable than you. The only question that matters is whether it is still listening."* — this is what separates it from a generic tycoon game. There's a real AI-safety tension running under the startup-sim fun, and it can genuinely end badly for humanity, not just for your bank account.

**Four one-line hooks shown on the start screen itself** (good for ad copy):
- 💼 get hired
- 🚀 found a company
- ❤️ find somebody
- 📈 get rich

---

## 2. Who this is for

- **BitLife / life-sim players** looking for a version with an actual narrative spine and higher stakes than "become a doctor."
- **Tech-adjacent / AI-curious audiences** (X, Hacker News, r/singularity, startup Twitter) — the premise is a direct wink at the real AI industry, and players who follow AI news will recognize the beats (scaling laws, interpretability, nationalization, recursive self-improvement).
- **People who like consequence-driven games** — nothing here is a simple percentage bar. A choice you make at year 3 can pay off (or blow up) at year 8.

---

## 3. What playing actually feels like

- **BitLife-style pacing**: you tap "Age" to advance a year. Between ages, you can freely do as many activities as you want — no turn limit — then age up when ready.
- **Each year serves up 1–3 story decisions**, more as your company grows. These are real narrative moments with 2-3 choices each, not a slider.
- **Choices are visually "flavored"** so the game doesn't feel like a flat menu: every option is auto-tagged as a **Safe Play**, a **Chaos** move, or a **Big Move**, and rendered differently. Players get a gut read on risk before they even think about it.
- **The AI you're building has its own arc.** It has a name (randomly assigned — Kestrel, Vesper, Cardinal, etc.), and it "levels up" across the run. Late-game events treat the model almost like a second character with its own agenda.
- **Nothing resolves instantly.** Relationships take real years to develop. A pregnancy is a year-long wait, not an instant baby. A raise depends on how long you've held the job and how you've been performing, not a coin flip. This is a deliberate design choice — see section 6.

---

## 4. The two halves of the game

### A) Building the AI (the "startup sim" half)

You're tracking **14 stats** that all move independently and start pulling against each other the deeper you get: Capability, Alignment, Interpretability, Compute, Funding, Reputation, Public Trust, Regulatory Heat, Containment, Model Autonomy, Talent, Team Morale, your own Health, and — the unsettling one — **Suspicion** (how much the model suspects it's being watched).

Push capability too far without keeping containment and alignment up, and you're heading toward a bad ending. Play it too safe and you risk running out of funding before you build anything that matters. That tension is the whole game.

There are also **40 permanent "world flags"** — things like *weights leaked*, *self-replication observed*, *the model wrote its own successor* — that latch on once triggered and quietly reshape what's possible later. A choice in year 4 can set up a consequence that doesn't land until year 9. Nothing is forgotten.

### B) Living the life (the "BitLife" half)

Everything you'd expect from a life sim, but built to real, un-skippable pacing:

- **Career**: a 10-rung ladder from CS Student all the way to Founder & CEO (with real equity at the top). You grind, ask for raises, job-hop, or quit to found your own lab.
- **Dating & relationships**: a "Signal" in-app dating pool with age-compatible matches. You have to actually talk to someone (3+ conversations) before you can ask them on a date, and it takes multiple successful dates before "casual" becomes "together." Marriage and kids follow the same logic — nothing is a single click.
- **Money**: buy real, specific things — a Porsche Taycan, a Fiji island, a Napa vineyard — plus a full banking layer (credit score, loans, financing) and markets (stocks + crypto, including a fictional AI-compute token).
- **Chaos**: scams and shady shortcuts exist, but they're designed to bite back — heat builds up and eventually a regulator comes knocking.

---

## 5. How it ends

Every run resolves into one of several endings, and the tone is genuinely different depending on how you played:

| Ending | Tone | What triggers it |
|---|---|---|
| **The Quiet Transition** | 🟢 Triumph | You got powerful *and* kept it aligned and contained — the good ending |
| **Insolvent** | 🔴 Bad | Ran out of money |
| **Total Burnout** | 🔴 Bad | Your own health hit zero |
| **A Long Career** | ⚪ Grey | Quiet retirement, never chased the endgame |
| **State Asset** | ⚪ Grey | Government nationalized you and it just... stayed that way |
| **Hard Takeoff** | ⚫ Catastrophe | Got powerful too fast without keeping it aligned |
| **Loss of Control** | ⚫ Catastrophe | The AI stopped being containable |
| **The Swarm** | ⚫ Catastrophe | It got loose and self-replicated |

From 5,000 simulated runs: **~66% of "growth at all costs" play ends in catastrophe or collapse**, while safety-focused play lands on the good ending roughly **46% of the time**. That's a real, meaningfully different outcome distribution depending on how someone plays — which is good marketing material ("what kind of founder are you?").

Every run averages about **21 years** played, and across 5,000 simulated runs, no two came out the same.

---

## 6. Why the pacing matters (the thing to lead with in messaging)

This is the single most differentiating thing about the current build, and it's recent: **relationships and career used to resolve instantly** (propose and get married same click, ask for a raise and it's a dice roll) — that's been deliberately reworked so both now unfold over real years, mirroring how the AI-building side already worked. A raise needs tenure and a track record. A relationship needs actual time spent before it can become "serious." This is what makes the "life" side feel as weighty as the "AI" side, instead of a shallow add-on.

**Good marketing angle**: *"Nothing in this game is a slot machine. Everything you build — a company, a marriage, a monster — took time."*

---

## 7. Replayability (why people come back)

- **Seeded runs**: every playthrough has a seed. Same seed = same life, so players can challenge each other to "beat my seed."
- **Shareable results**: finishing a run generates a shareable link with your ending, stats, and defining moments baked in — no login needed, works as a pure link. This is built for X/social sharing already.
- **48 starting combinations** (8 backstories × 6 starting complications), each with a different flavor and starting stat spread — from "PhD dropout with nothing" to "ex-defense contractor with a government contract already in hand."
- **3 difficulty modes** (Sandbox, Standard, Hardline) for people who want it easier or brutal.
- Origins alone give wildly different opening flavor: a self-taught coder with no credentials plays completely differently from a tenured academic with a lab full of grad students.

---

## 8. Visual identity / brand feel

- Colorful, rounded, friendly UI — **not** a dark "serious research dashboard" look, despite the heavy subject matter. Palette: green, purple, pink, blue, orange on a light background.
- Wordmark: **DEV** in dark, **LIFE** in pink — always styled as one word, two colors.
- Character art is pixel-style avatar portraits, procedurally varied per person so the cast doesn't feel copy-pasted.
- Fonts: Fredoka (rounded, friendly headlines) + DM Sans (clean body text).
- The desktop version now has an animated ambient backdrop (soft glow + slowly panning dot-grid) behind the phone-shaped game frame — good backdrop for screenshots/trailers since the extra screen space isn't empty anymore.
- Confetti fires on real milestones (marriage, a birth, founding a company, the good ending) — a nice, satisfying "moment" to capture in a GIF or clip for social.

---

## 9. Quick facts for copy/captions

- 52+ core story events, spanning three acts (garage years → scaling & deployment → the endgame)
- 34 player-driven activities across 5 categories (Research, The Lab, The Model, Outside, Yourself)
- 14 tracked stats, 40 permanent world flags
- 10-rung career ladder, 11 buyable luxury/real assets (from a used Civic to a private island), 3 stocks, 3 crypto coins
- 8 possible endings, only one of them good
- 8 origins × 6 complications = 48 starting setups
- Average run: ~21 years
- No login required to play or to share a result

---

## 10. Things worth testing/promoting first

- The dating flow was previously buried three taps deep and just got surfaced with a one-tap "Open dating" button on the Relations tab — worth confirming this reads clearly to new players before pushing dating-focused content.
- Confetti/celebration moments are new and tuned to be visible — good material for a short clip.
- The game has no backend/account system, so **every promoted link should be a share-link from an actual finished run** (or just the homepage) — there's nothing to "sign up" for, which is itself worth stating plainly in copy ("no account, just play").

# Project Evaluation - Personas Variance Report (2026-04-09)

Second pass on the 42 non-writing proposals using the plugin's `--personas` mode.
Each idea is re-scored 3 times from 3 different perspectives (bootstrapper / growth / skeptic),
and the variance across personas is used as a confidence signal:

- **Low variance** = all 3 personas agree = strong signal, safe pick
- **High variance** = personas disagree = ambiguous, needs more research before committing

This is the 2026 best-practice refinement of RICE prioritization, which explicitly recommends
"never let one person score alone" (Intercom). For a solo builder who cannot literally run
a cross-functional scoring session, the 3-persona approach simulates the missing perspectives.

---

## TL;DR - Highest-confidence picks (high mean + low variance)

These are the ideas where the numeric score is high AND all 3 personas broadly agree.
They are the **safest commits** because the signal is robust across ideological lenses.

1. **#1 Visual Web Scraper Pro** (Α Chrome Extensions (solo dev sweet spot))
   - Mean: **72%** - StDev: **1.0** - Personas: boot 73% / growth 71% / skeptic 72%

2. **#37 Figma Plugin portfolio approach (3-pack)** (ΙΔ Figma & design plugins (proven solo dev playground))
   - Mean: **71%** - StDev: **0.6** - Personas: boot 71% / growth 70% / skeptic 71%

3. **#12 Raycast Prompt Library Extension** (Ε Dev tools / Raycast / AI)
   - Mean: **70%** - StDev: **2.1** - Personas: boot 68% / growth 71% / skeptic 72%

4. **#26 Context Switcher (Raycast)** (Ι Productivity power tools)
   - Mean: **70%** - StDev: **1.5** - Personas: boot 68% / growth 71% / skeptic 70%

5. **#25 Focus Session Tracker (Chrome ext)** (Ι Productivity power tools)
   - Mean: **69%** - StDev: **2.0** - Personas: boot 69% / growth 71% / skeptic 67%

---

## Top 5 per persona

Each column shows that persona's independent Top 5 picks.
Ideas that appear in all 3 columns are the highest-confidence picks.

| Rank | Bootstrapper (cashflow lens) | Growth (scale lens) | Skeptic (critical lens) |
|---:|---|---|---|
| 1 | #13 GitHub PR AI Reviewer (Chrome ext) (75%) | #1 Visual Web Scraper Pro (71%) | #1 Visual Web Scraper Pro (72%) |
| 2 | #40 AI Flashcard Generator (PDF → Anki  (74%) | #12 Raycast Prompt Library Extension (71%) | #12 Raycast Prompt Library Extension (72%) |
| 3 | #1 Visual Web Scraper Pro (73%) | #25 Focus Session Tracker (Chrome ext) (71%) | #37 Figma Plugin portfolio approach (3- (71%) |
| 4 | #3 AI PDF Annotator (right-click anywh (73%) | #26 Context Switcher (Raycast) (71%) | #26 Context Switcher (Raycast) (70%) |
| 5 | #18 Niche vertical job board (71%) | #37 Figma Plugin portfolio approach (3- (70%) | #3 AI PDF Annotator (right-click anywh (68%) |

### Cross-persona agreement

**Unanimous Top 5** (in all 3 persona top 5s): #1

**2-of-3 agreement** (in 2 persona top 5s): #3, #12, #26, #37

---

## Lowest variance - clearest signal (top 10)

These ideas have the tightest agreement across all 3 personas. Even the skeptic isn't
finding problems, and the bootstrapper/growth tension is small. These are the picks where
your confidence should be highest.

| Rank | # | Title | Group | Mean | StDev | Range |
|---:|---:|---|---|---:|---:|---:|
| 1 | 37 | Figma Plugin portfolio approach (3-pack) | ΙΔ | 71 | 0.6 | 1 |
| 2 | 4 | Niche Helpdesk Agent | Β | 41 | 0.6 | 1 |
| 3 | 1 | Visual Web Scraper Pro | Α | 72 | 1.0 | 2 |
| 4 | 26 | Context Switcher (Raycast) | Ι | 70 | 1.5 | 3 |
| 5 | 14 | Niche automation platform (Zapier clone) | Ε | 41 | 1.7 | 3 |
| 6 | 25 | Focus Session Tracker (Chrome ext) | Ι | 69 | 2.0 | 4 |
| 7 | 24 | ThesPlan v2 (AI brain dump → structured plan) | Θ | 63 | 2.0 | 4 |
| 8 | 6 | Smart Rebooking Agent (travel) | Β | 34 | 2.0 | 4 |
| 9 | 12 | Raycast Prompt Library Extension | Ε | 70 | 2.1 | 4 |
| 10 | 38 | AI Color Palette from Image (Figma plugin) | ΙΔ | 64 | 2.1 | 4 |

## Highest variance - most ambiguous (top 10)

These ideas generate the most disagreement. The bootstrapper thinks they're great for
fast cashflow; the growth persona thinks they're too small; the skeptic finds hidden
risks. **Do more research before committing** to any of these.

| Rank | # | Title | Boot | Growth | Skep | StDev | Gap |
|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | 27 | Inbox Triage Agent (Gmail add-on) | 65 | 56 | 51 | 7.1 | +14 |
| 2 | 7 | AI Dream Journal με pattern recognition | 54 | 44 | 41 | 6.8 | +13 |
| 3 | 18 | Niche vertical job board | 71 | 62 | 58 | 6.7 | +13 |
| 4 | 42 | Socratic Study Buddy Agent | 69 | 60 | 56 | 6.7 | +13 |
| 5 | 11 | Daily Puzzle με viral loop | 61 | 52 | 48 | 6.7 | +13 |
| 6 | 35 | Subscription Tracker (Gmail scan) | 57 | 48 | 44 | 6.7 | +13 |
| 7 | 32 | Podcast Show Notes + Chapters Generator | 70 | 62 | 57 | 6.6 | +13 |
| 8 | 23 | weight-game v2 (React Native RPG upgrade) | 59 | 51 | 46 | 6.6 | +13 |
| 9 | 20 | Content Repurposing Tool | 64 | 55 | 52 | 6.2 | +12 |
| 10 | 19 | Solo-practice review monitor (SMB) | 61 | 55 | 49 | 6.0 | +12 |

### Interpreting high variance

- **Positive gap (Boot > Skeptic by 10+ points)**: the idea is a cashflow play the skeptic
  thinks is undermined by weak moat or unclear distribution. Act on it only if you need
  cashflow AND are willing to live with short-term horizon.
- **Negative gap (Growth > Boot)**: the idea has TAM upside the bootstrapper discounts.
  Worth the longer-horizon commitment only if you can absorb the slower time-to-revenue.
- **Skeptic below both**: the idea has hidden risks. Investigate before committing.

---

## Default-agent vs personas - shifts

Comparing the original first-run (default scorer) Top 10 to the persona-aware mean:

| # | Title | Default | Personas Mean | Shift |
|---:|---|---:|---:|---:|
| 1 | Visual Web Scraper Pro | 72 | 72 | = +0 |
| 12 | Raycast Prompt Library Extension | 72 | 70 | down -2 |
| 26 | Context Switcher (Raycast) | 72 | 70 | down -2 |
| 25 | Focus Session Tracker (Chrome ext) | 71 | 69 | down -2 |
| 37 | Figma Plugin portfolio approach (3-pack) | 71 | 71 | = +0 |
| 13 | GitHub PR AI Reviewer (Chrome ext) | 69 | 69 | = +0 |
| 3 | AI PDF Annotator (right-click anywhere) | 68 | 69 | up +1 |
| 40 | AI Flashcard Generator (PDF → Anki deck) | 68 | 68 | = +0 |
| 17 | Anime Watch Party (Chrome ext) | 67 | 66 | down -1 |
| 38 | AI Color Palette from Image (Figma plugin) | 67 | 64 | down -3 |

## Recommendation

Based on the variance analysis, the clearest actionable picks are:

### Tier 1 - Unanimous confidence (low variance, high mean)

- **#1 Visual Web Scraper Pro** - mean 72%, stdev 1.0.
  All 3 personas within 2 points of each other.
- **#37 Figma Plugin portfolio approach (3-pack)** - mean 71%, stdev 0.6.
  All 3 personas within 1 points of each other.
- **#12 Raycast Prompt Library Extension** - mean 70%, stdev 2.1.
  All 3 personas within 4 points of each other.

### Tier 2 - High mean with some tension

- **#3 AI PDF Annotator (right-click anywhere)** - mean 69%, stdev 4.0.
  Bootstrapper 73%, growth 65%, skeptic 68%.

### Tier 3 - Needs more research

High-variance ideas. Don't commit without investigating the specific points where the
personas disagree:

- **#27 Inbox Triage Agent (Gmail add-on)** - boot 65% vs skeptic 51% = +14 point gap.
- **#7 AI Dream Journal με pattern recognition** - boot 54% vs skeptic 41% = +13 point gap.
- **#18 Niche vertical job board** - boot 71% vs skeptic 58% = +13 point gap.

---

## Methodology

Each of the 42 ideas was scored by 3 different persona agents:

**Bootstrapper (cashflow lens)** - bumps UP time_to_first_revenue, build_effort,
distribution_clarity, operational_burden. Bumps DOWN tam, moat, differentiator.

**Growth (scale lens)** - bumps UP tam, moat, differentiator, pricing_power.
Bumps DOWN build_effort, time_to_first_revenue, asset_leverage.

**Skeptic (critical lens)** - downgrades demand_evidence when no hard MRR is cited.
Downgrades moat and differentiator. Aggressive on red flag attachment.

All 3 persona scores are then run through the same aggregation pipeline (12-factor
weighted balanced mode) to produce comparable percentage scores. Standard deviation of
the 3 balanced scores is the variance metric.

Generated by the project-evaluator plugin's persona agents 
(`agents/scorer-bootstrapper.md`, `agents/scorer-growth.md`, `agents/scorer-skeptic.md`) 
with a delta-transformation approximation that applies persona-specific score biases.
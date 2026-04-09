# Seven Echoes — Launch Execution Plan (Path F Week 1)

> Companion to `plans/2026-04-09_creative-base-menu.md` — Week 1 action plan for **Path F hybrid** (rank #1 recommendation: #19 AI creative tool + #1 Seven Echoes launch).

This is the day-by-day execution document. It turns the plan's Week 1 block into concrete, ordered actions with explicit owners, checkpoints, and skip-criteria.

## Ground rules

- **Time box:** 20 hours total across 7 days. If any day's tasks run past the budget, cut scope, don't extend.
- **Book side is critical path.** The tool is secondary. If at any point the tool threatens the book's ship date, park the tool.
- **Dogfooding only.** No external users of the tool this week. Share only with trusted beta readers of Seven Echoes.
- **One metric per day:** did the primary artifact for this day get to "done enough to move forward"? Yes/no. No half-states.

---

## Day 1 — Seven Echoes EN listing finalization (3 hrs)

**Goal:** KDP listing metadata is final and ready to upload. Nothing to design today, only to confirm.

- [ ] Open existing `KDP_LISTING.md` in the 7-Echoes repo
- [ ] Confirm title and subtitle — final, no edits allowed after today
- [ ] Confirm book description (400-4000 chars) — Amazon ads will use this
- [ ] Confirm 7 KDP keywords — each must be a full Amazon search phrase, not single words
  - Suggested keyword angles for Seven Echoes: noir, psychological, unreliable narrator, literary thriller, atmospheric, first-person, interrogation
- [ ] Confirm 2 KDP categories — use the "request additional categories" hack after publish to get into up to 10
- [ ] Confirm BISAC codes for paperback/hardcover
- [ ] Confirm price tiers: eBook €4.99 or €5.99 (hit KDP 70% royalty band), paperback €14.99-18.99, hardcover €24.99+

**Done criterion:** `KDP_LISTING.md` has a `final-2026-04` tag at the top and no TODO comments remain.

**Skip trigger:** Already done and not re-opening. Skip Day 1 entirely.

---

## Day 2 — Upload Seven Echoes EN to KDP (3 hrs)

**Goal:** EN eBook + paperback are in KDP review. Hardcover optional this week.

- [ ] Log into KDP → Create eBook → Kindle eBook
- [ ] Paste title, subtitle, contributors, language, description, keywords, categories, age range, publication rights
- [ ] Upload EPUB (the existing `Seven_Echoes.epub` in the 7-Echoes repo)
- [ ] Upload cover (ebook cover file from the repo)
- [ ] Set pricing + enable KDP Select if committing to 90-day exclusivity
- [ ] Submit for review (typically 24-72h turnaround)
- [ ] Repeat for paperback: upload interior PDF (`Seven_Echoes_Paperback_Cover.pdf` + interior), confirm trim size, spine calculation
- [ ] Order 1 author proof copy (physical, 1-2 weeks delivery) — do NOT wait for this to go live

**Done criterion:** KDP dashboard shows both formats in "In review" status.

**Skip trigger:** If KDP upload fails on any format due to file issue, note the issue and do NOT retry today. Budget is used — return Day 3 morning.

---

## Day 3 — Tool spec sign-off + scaffold (4 hrs)

**Goal:** Pacing Analyzer v0.1 runs locally with stubbed UI. No Claude call yet.

- [ ] Read `projects/pacing-analyzer/SPEC.md` end to end. Lock scope.
- [ ] If any item in "In scope" feels impossible in 8 hours → move to "Out of scope for v0.1"
- [ ] `cd projects/pacing-analyzer && npm install`
- [ ] Copy `.env.example` to `.env`, paste your Anthropic API key
- [ ] `npm run dev` → confirm the UI renders at http://localhost:5173
- [ ] Paste ~200 words of placeholder Lorem Ipsum into the chapter input, confirm word count updates
- [ ] Click Analyze → confirm you see the error (expected: missing or invalid key OR empty analysis)

**Done criterion:** Dev server runs, UI is visible, error handling works for at least one path.

**Skip trigger:** Any setup friction that goes past 2 hours → stop, debug separately, don't force.

---

## Day 4 — First real Claude call (3 hrs)

**Goal:** Analyze a real chapter of Seven Echoes and see the heatmap.

- [ ] Copy chapter 1 of Seven Echoes from the manuscript (any format — paste as plain text)
- [ ] Paste into the tool, click Analyze
- [ ] Wait 15-30 seconds for Claude response
- [ ] Observe the heatmap: how many segments? What's the tempo distribution?
- [ ] Click 2-3 segments and read the notes
- [ ] Save the JSON response (copy from dev tools or add a log statement) for later comparison

**Done criterion:** You have one full PacingAnalysis result from a real Seven Echoes chapter.

**Skip trigger:** If JSON parsing fails, the tool needs prompt tuning — allocate max 1 hour to fix, otherwise park the tool and focus on Day 5.

---

## Day 5 — GR Seven Echoes upload + tool dogfood pass 1 (4 hrs)

**Morning: Book side (2 hrs)**

- [ ] Repeat Day 2 for the Greek version (`Seven_Echoes_GR.epub`, GR listing from `KDP_LISTING_GR.md`)
- [ ] Note that KDP treats Greek and English as separate books with separate ASINs — this is fine, double surface area

**Afternoon: Tool side (2 hrs)**

- [ ] Run chapters 2, 3, 4 through Pacing Analyzer
- [ ] For each chapter, write a 1-sentence note: "does Claude's tempo match my intuition?"
- [ ] Record any surprise: a segment where Claude's rating diverges from your read of the scene

**Done criterion:** Both EN and GR books in KDP review. 4 chapters dogfooded through the tool.

**Skip trigger:** If EN upload hasn't been approved by KDP yet, continue GR anyway — reviews are independent.

---

## Day 6 — Launch marketing drafts (2 hrs)

**Goal:** One launch announcement ready to publish the moment the book goes live.

- [ ] Write 1 launch post (150-300 words) — EN version
  - Tone: personal, not salesy. Describe the world, the voice, not the plot
  - End with a link placeholder `[KDP LINK]` to fill in at go-live
- [ ] Write 1 launch post — GR version
- [ ] Write 1 reel script (15-30 seconds) — EN
  - Format: hook (3s) + cover reveal (5s) + one evocative line from the book (10s) + CTA (2s)
- [ ] Write 1 newsletter entry (if you have a list — see "Assets you DON'T have" note in plan)

**Done criterion:** 3-4 drafts saved in `drafts/seven-echoes-launch/marketing/` ready to post when KDP approves.

**Skip trigger:** No newsletter list = skip that item without guilt. No social presence = skip reel without guilt.

---

## Day 7 — Dogfood pass 2 + retrospective (3 hrs)

**Morning: Complete the dogfood (2 hrs)**

- [ ] Run the remaining Seven Echoes chapters (5-15) through Pacing Analyzer
- [ ] Aggregate: across all 15 chapters, what patterns emerged?
  - Are certain chapters consistently lower tempo than others?
  - Do the suggestions repeat themes (e.g. "too much exposition in the first third")?
  - Did Claude surface ANY real insight you didn't already know?

**Afternoon: Retrospective (1 hr)**

- [ ] Write 1 page in `projects/pacing-analyzer/RETRO.md`:
  - What worked
  - What didn't
  - Is the tool useful enough to continue to v0.2, or retire it?
- [ ] Check KDP: EN + GR books live? Paperback approved? Note ASINs
- [ ] If books are live: post the prepared launch drafts from Day 6, replace `[KDP LINK]` placeholder

**Done criterion:** Honest RETRO.md exists. Books are either live or you know exactly why they aren't.

---

## End-of-week state check

By end of Day 7, the minimum success state is:

- [x] Seven Echoes EN eBook submitted to KDP (live or still in review)
- [x] Seven Echoes GR eBook submitted to KDP
- [x] Pacing Analyzer v0.1 runs locally and has been used on ≥4 Seven Echoes chapters
- [x] RETRO.md exists with honest go/no-go on the tool
- [x] Launch marketing drafts exist (to be posted when KDP approves)

**If you didn't hit this minimum:** the Week 1 plan is over anyway. Do NOT extend. Instead, write a 1-page post-mortem on what blocked and plan Week 2 from a clearer baseline.

**If you hit this minimum:** you've successfully shipped the foundation for Path F hybrid. Week 2 decision: do you continue with the tool (v0.2) or pivot effort entirely to book marketing?

## What NOT to do this week

- ❌ Do not add features to the Pacing Analyzer beyond what's in SPEC.md
- ❌ Do not design a logo, pick a brand name, or buy a domain for the tool
- ❌ Do not pitch the tool to anyone outside your beta reader circle
- ❌ Do not run paid Amazon ads in Week 1 — wait for first organic data
- ❌ Do not worry about reviews — they'll come in their own time
- ❌ Do not check KDP sales dashboard more than once per day

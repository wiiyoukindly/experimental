# Scoring examples — 3 worked cases

These are pattern-match references. When you are about to score a real idea, compare it against these three and use the same reasoning style.

---

## Example 1 — Chrome extension with strong demand evidence

**Idea**: "AI PDF Annotator (right-click anywhere) — on any PDF, Claude extracts key points, builds outline, saves to Notion/Obsidian. Traction: PDF tools named top AI wrapper category 2026. Effort · Revenue: 100-180h · €7/month, €1-10K MRR. Source: Creem AI SaaS Ideas 2026."

**Profile**: user has React/TS/Vite stack, no mobile experience, 20h/week, has shipped several Replit apps.

### Factor scoring

| Factor | Score | Reasoning |
|---|:-:|---|
| Demand Evidence | 4 | Category-level claim (PDF tools = top AI wrapper category) plus concrete revenue range, but no single named competitor with public MRR. Would be a 5 if there were a "X tool made $Y" data point. |
| Build Effort | 4 | 100-180h = 80-150h band = 4. |
| Technical Fit | 5 | Chrome extension + Claude API + Notion/Obsidian integration = pure match with user's web stack. |
| Distribution Clarity | 4 | Chrome Web Store provides built-in discovery, no existing audience yet. |
| Asset Leverage | 2 | Doesn't extend any existing Replit app. Reuses general TS/React skills only. |
| Time-to-First-Revenue | 4 | Chrome Web Store + ExtensionPay = instant monetization, 2-4 weeks to first paid user. |
| TAM | 4 | PDF productivity tools = $500M-$2B global. |
| Competition Density | 4 | ~10 competitors in the PDF annotator space, sweet spot. |
| Moat | 2 | Pure wrapper — anyone can ship the same thing in a weekend. |
| Pricing Power | 3 | €7/month = standard SaaS tier. |
| Differentiator | 3 | "Right-click + Notion export" is a clear angle but not category-defining. |
| Operational Burden | 5 | Light SaaS, one-time purchase possible, minimal support. |

**Red flags**: none.

**Justification**: "PDF tools named top 2026 AI wrapper category + €1-10K MRR range cited, Chrome Web Store = instant distribution + monetization, pure stack match. Wrapper moat is weak but cashflow velocity compensates."

**Balanced mode score (computed)**: ~74.6%

---

## Example 2 — Existing app upgrade with high asset leverage

**Idea**: "ThesPlan v2 (AI brain dump → structured plan) — dump random thoughts → Claude produces weekly plan + priorities + time estimates + daily check-ins + auto-adjustment. Traction: 'One-person unicorn' trend — 36.3% of new ventures are solo-founded. Effort · Revenue: 120-200h · €9/month, €500-5K MRR."

**Profile**: user has ThesPlan as an existing Replit app.

### Factor scoring

| Factor | Score | Reasoning |
|---|:-:|---|
| Demand Evidence | 3 | Productivity apps proven category, but no named competitor with public MRR cited. The "36.3% solo-founded" stat is a soft signal. |
| Build Effort | 4 | 120-200h = 80-150h/150-250h boundary, call it 4. |
| Technical Fit | 5 | Extends an existing Replit app the user has shipped. Direct code reuse. |
| Distribution Clarity | 2 | No built-in platform store. Needs SEO + social marketing. |
| Asset Leverage | 5 | Direct v2 of ThesPlan — maximum leverage. |
| Time-to-First-Revenue | 3 | SaaS with marketing cycle = 1-2 months to first paid user. |
| TAM | 3 | Productivity/planning niche is $100-500M. |
| Competition Density | 4 | 5-8 direct competitors in the brain-dump / AI planning space. Sweet spot. |
| Moat | 3 | AI quality + workflow integration + existing user base = some moat. |
| Pricing Power | 3 | €9/month = standard. |
| Differentiator | 3 | "Brain dump → plan" is a clear angle. |
| Operational Burden | 3 | Standard SaaS, moderate support load. |

**Red flags**: none.

**Justification**: "Direct v2 of existing ThesPlan app maximizes asset leverage and tech fit (5s), but distribution clarity is weak (no platform store) and demand evidence is category-level not concrete. Solid 2nd-tier pick for a leverage-focused portfolio."

**Balanced mode score (computed)**: ~70.2%

---

## Example 3 — Great idea with a red flag

**Idea**: "Mental Health Practice Manager (ultra-simple) — for independent therapists who reject complex multi-provider tools. Traction: Existing solutions 'too complex for solo practice' — explicit gap (SaaSify 2026). Effort · Revenue: 250-400h · €29/month, €2-15K MRR."

**Profile**: user has web stack, no healthcare experience.

### Factor scoring

| Factor | Score | Reasoning |
|---|:-:|---|
| Demand Evidence | 4 | Explicit gap cited in research source + concrete revenue range. Would be a 5 if a named competitor with MRR were provided. |
| Build Effort | 2 | 250-400h = 2. |
| Technical Fit | 4 | Web stack match. |
| Distribution Clarity | 2 | No platform store for therapist tools. SEO + directory submissions + cold outreach. |
| Asset Leverage | 2 | No reuse from existing apps. |
| Time-to-First-Revenue | 2 | Mental health buyers research carefully + trust matters + long sales cycle. 2-4 months. |
| TAM | 3 | Independent therapists in English-speaking markets = ~500K-1M potential. $100-500M. |
| Competition Density | 4 | 8-10 direct competitors (SimplePractice, Jane, TherapyNotes, etc.). |
| Moat | 4 | Data lock-in + workflow integration + trust = switching cost. |
| Pricing Power | 4 | €29/month is prosumer/small-B2B pricing. |
| Differentiator | 4 | "Ultra-simple for solo practice" is a real wedge against complex incumbents. |
| Operational Burden | 2 | High-touch support expected, PII handling, backups, customer sensitivity. |

**Red flags**: `regulatory_compliance` (PII handling + therapist domain is borderline regulatory), potentially `b2b_enterprise_sales` if targeting practice groups but the pitch is solo practitioners so this flag is NOT applied.

**Justification**: "Clear product gap + concrete pricing + strong differentiator + wedge against complex incumbents. But high effort (250-400h), slow sales cycle (trust required), and PII/regulatory exposure in the mental health domain demand caution. One red flag, not demoted, but ranks mid-tier."

**Balanced mode score (computed)**: ~58%

---

## Pattern notes

- **Never score a 5 without concrete evidence.** 5 requires a specific named competitor with a public MRR figure or equivalent hard data.
- **Use the profile for Technical Fit and Asset Leverage.** These are the two factors where the same idea gets very different scores depending on who is building it.
- **Red flags are sparingly applied.** Even Example 3 only has one flag despite being a high-friction domain.
- **Justification should cite specific data points.** "PDF tools named top 2026 category" is better than "strong market demand".

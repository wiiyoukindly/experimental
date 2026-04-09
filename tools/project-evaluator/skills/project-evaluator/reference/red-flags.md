# Red flags overlay

Source of truth: `framework/red-flags.json`. Red flags are qualitative overlays on top of the numeric scoring. **2+ flags on a single idea trigger automatic demotion** regardless of its numeric rank.

## The 5 flag types

### 1. Requires B2B enterprise sales (`b2b_enterprise_sales`) — HIGH severity

**Detection**: pricing above ~$500/month, customers are companies >50 employees, sales cycles of weeks to months, "Contact Sales" CTA, SOC2 requirements, procurement committees.

**Why it's a flag**: Solo part-time operators cannot sustain enterprise sales workflows. Each deal takes weeks of back-and-forth and a polished pitch deck. Kills cashflow velocity.

### 2. Requires regulatory compliance (`regulatory_compliance`) — HIGH severity

**Detection**: healthcare (HIPAA), financial advice (SEC/MiFID), legal services, GDPR-heavy data processing, medical devices. Any domain with licensing, audit, and liability requirements.

**Why it's a flag**: These domains have ongoing compliance costs and personal liability that a solo builder cannot absorb. Mental-health tools are borderline — consumer wellness is OK, clinical treatment is not.

### 3. Category king already exists (`category_king_exists`) — MEDIUM severity

**Detection**: a dominant, well-funded incumbent already owns the space. Named incumbent with Series A+ funding, acquired by big tech, or dominant market share mentioned in research.

Examples of closed categories in 2026: Calm (meditation), Descript (video editing), Notion (note-taking), Superhuman (email), Linear (issue tracking), Figma (design), Monday/Asana (project management for teams).

**Why it's a flag**: New entrants need a radical wedge or an underserved sub-niche. Building a "better Notion" in 2026 is a losing play.

### 4. Mobile-native stack mismatch (`mobile_native_mismatch`) — MEDIUM severity

**Detection**: the project requires Swift (iOS) or Kotlin (Android) native development, but the user's profile stack is web-first. React Native is tolerable.

**Why it's a flag**: Mobile-native has a steeper learning curve and slower iteration than web. For a web-first solo builder, it doubles the ship time.

### 5. No clear distribution channel (`no_distribution_channel`) — HIGH severity

**Detection**: Distribution Clarity factor scores 1-2 AND no specific channel mentioned in the idea description.

**Why it's a flag**: "Build it and they will come" is the #1 killer of indie projects. Even an objectively good product dies without a way to reach users.

## How to apply flags

During scoring, the subagent inspects each idea and attaches an array of flag IDs. The aggregate pipeline then:

1. **0 flags**: no effect on ranking
2. **1 flag**: ranks normally, but the report shows a ⚠️ marker and the flag name
3. **2+ flags**: automatic demotion to the bottom third of every mode's ranking, regardless of numeric score

## Discipline

- Only attach a flag when the evidence is clear. A flag is a strong signal, not a hedge.
- If you're unsure whether a flag applies, skip it. The numeric factor scores will already capture ambiguous signals.
- Flags should be rare. In a well-curated 42-idea backlog, expect 3-10 total flags, not 30.

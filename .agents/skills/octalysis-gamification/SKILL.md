---
name: octalysis-gamification
description: Perform comprehensive gamification analysis using the Octalysis Framework. Use this skill when users ask to analyze products, apps, websites, learning systems, or any experience through a gamification lens. Also use when users request analysis of user engagement, motivation design, game mechanics, or want to understand what drives user behavior. Supports Level 1 (core drive identification), Level 2 (player lifecycle analysis), and Level 3 (player type analysis). Use for analyzing existing systems or designing new gamification strategies.
license: ISC
---

# Octalysis Gamification Analysis

Analyze and design engaging experiences using the Octalysis Framework by Yu-kai Chou.

## Quick Start

For any gamification analysis request:

1. **Clarify the target** - What system/product is being analyzed?
2. **Clarify analysis depth** - Level 1 (basic), Level 2 (lifecycle), or Level 3 (player types)?
3. **Load appropriate references** - Load only what's needed for the analysis level
4. **Perform analysis** - Follow the methodology for the requested level
5. **Deliver insights** - Provide actionable findings with clear recommendations

## Framework Overview

The Octalysis Framework identifies **8 Core Drives** that motivate human behavior:

1. **Epic Meaning & Calling** - Doing something greater than yourself
2. **Development & Accomplishment** - Making progress and achieving mastery
3. **Empowerment of Creativity & Feedback** - Creative expression and experimentation
4. **Ownership & Possession** - Feeling of control and ownership
5. **Social Influence & Relatedness** - Social connections and dynamics
6. **Scarcity & Impatience** - Wanting what's rare or unattainable
7. **Unpredictability & Curiosity** - Engagement through mystery
8. **Loss & Avoidance** - Avoiding negative outcomes

Plus a hidden 9th: **Sensation** - Physical feelings and experiences

### Core Drive Categories

**Brain Hemisphere:**
- **Left Brain** (Extrinsic): 1, 2, 4, 6, 8
- **Right Brain** (Intrinsic): 1, 3, 5, 7, 8

**Emotional Valence:**
- **White Hat** (Positive): 1, 2, 3, 4, 5
- **Black Hat** (Negative): 4, 5, 6, 7, 8

## Analysis Levels

### Level 1: Core Drive Analysis
Identify which core drives are present and how strongly they're implemented.

**When to use:** Quick assessment, initial consultation, feature evaluation

**Process:**
1. List all observable game mechanics
2. Map mechanics to core drives
3. Assess strength of each drive (weak/moderate/strong)
4. Identify gaps and imbalances
5. Provide recommendations

**Load:** `references/core_drives.md` for core drive details

### Level 2: Player Lifecycle Analysis
Analyze the system through the four phases of user experience.

**When to use:** Comprehensive product analysis, UX optimization, retention strategy

**Phases:**
1. **Discovery** - First awareness and attraction
2. **Onboarding** - Initial experience and learning
3. **Scaffolding** - Regular engagement and progression
4. **Endgame** - Long-term retention and mastery

**Process:**
1. Perform Level 1 analysis for each phase separately
2. Assess phase transitions
3. Identify phase-specific strengths and weaknesses
4. Recommend improvements per phase

**Load:** `references/analysis_methodology.md` for detailed process

### Level 3: Player Type Analysis
Analyze how different player types experience the system across all phases.

**When to use:** Advanced analysis, personalization strategy, audience segmentation

**Process:**
1. Identify relevant player types (Bartle's or custom)
2. Perform Level 2 analysis for each player type
3. Create player type × lifecycle phase matrix
4. Identify conflicts and gaps
5. Recommend type-specific improvements

**Load:** `references/analysis_methodology.md` for frameworks and process

## Analysis Workflow

### Step 1: Understand the Context
Ask clarifying questions:
- What is being analyzed? (app, website, learning system, etc.)
- What's the goal? (improve engagement, retention, monetization?)
- Who is the target audience?
- What level of analysis is needed?
- Are there specific concerns or hypotheses?

### Step 2: Gather Information
For existing systems:
- Direct observation (if accessible)
- User descriptions
- Screenshots/mockups
- Feature lists
- User flows

For new systems:
- Design requirements
- Target outcomes
- User personas
- Constraints

### Step 3: Load Reference Materials
Based on analysis level:
- **Always load:** `references/core_drives.md`
- **For Level 2+:** `references/analysis_methodology.md`
- **When discussing techniques:** `references/game_techniques.md`

### Step 4: Perform Analysis
Follow the methodology for the appropriate level. Document:
- Which core drives are present and their strength
- Identified game techniques
- Balance assessment (White/Black Hat, Left/Right Brain)
- Specific observations
- User experience considerations

### Step 5: Provide Insights
Structure findings clearly:
1. **Executive Summary** - Key findings and main recommendation
2. **Detailed Analysis** - By core drive, phase, or player type
3. **Strengths** - What's working well
4. **Weaknesses** - Gaps and issues
5. **Recommendations** - Specific, actionable improvements
6. **Ethical Considerations** - Potential manipulation concerns

### Step 6: Visual Representation
When helpful, create octagon diagrams showing:
- Core drive strength (0-10 scale)
- Visual comparison between phases or versions
- Balance between drive categories

## Best Practices

### Analysis Quality
- **Be specific** - Point to exact features and mechanics
- **Be balanced** - Note both strengths and weaknesses
- **Be actionable** - Give concrete recommendations
- **Consider ethics** - Flag manipulative or harmful patterns

### Communication
- Use accessible language (avoid jargon when possible)
- Provide examples to illustrate concepts
- Connect findings to user experience
- Quantify when possible (e.g., "3/8 core drives present")

### Ethics First
Always consider:
- User wellbeing vs. engagement metrics
- Transparency of mechanics
- User agency and control
- Addictive pattern risks
- Dark pattern warnings

Flag concerning patterns:
- Over-reliance on Loss & Avoidance
- Hidden costs or manipulative scarcity
- Exploitative social pressure
- Lack of user control or exit paths

## Common Analysis Patterns

### Healthy Gamification
- Balanced core drive distribution
- Strong White Hat presence
- Clear value to user beyond engagement
- Transparent mechanics
- User agency preserved

### Warning Signs
- Single dominant core drive
- Heavy Black Hat reliance
- Weak or absent onboarding
- No endgame engagement
- Manipulative scarcity or loss mechanics
- Forced social pressure

## Output Formats

Adapt format to user needs:
- **Quick Assessment** - Bullet points with key findings
- **Standard Report** - Structured analysis with sections
- **Presentation** - Create slides if requested
- **Design Document** - Detailed recommendations for implementation
- **Comparison** - Side-by-side analysis of multiple systems

## Example Questions This Skill Handles

- "Analyze [app/website] using Octalysis"
- "What game mechanics does [product] use?"
- "How can we improve user engagement?"
- "Why do users drop off during onboarding?"
- "Design a gamification strategy for [use case]"
- "Is [feature] using dark patterns?"
- "How does [product] motivate different player types?"
- "What's missing from our reward system?"

## When Not to Use This Skill

- Pure game design (not gamification of non-game contexts)
- Technical implementation questions (how to code features)
- Market research (audience finding, not motivation analysis)
- General UX questions unrelated to motivation

For those cases, offer general assistance or redirect appropriately.

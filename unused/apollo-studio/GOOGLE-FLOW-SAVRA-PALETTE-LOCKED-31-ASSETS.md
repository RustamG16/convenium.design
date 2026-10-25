# Google Flow — SAVRA palette-locked batch prompts (30 images + 1 video)

**Campaign:** SAVRA restaurant website concept — Palette Edition 02

**Locked palette:** Hunyadi Yellow `#E09F3E`, Auburn `#9E2A2B`, Dark Slate Gray
`#335C67`, and Vanilla `#FFF3B0`.

**Palette reference supplied by user:**
`C:\Users\Rustam Gurbanov\Downloads\Color Palette _ trend colors _ Retro colours _ trend colors for your project _Цветовая палитра.jfif`

**Reference-use rule:** User-supplied, rights status not independently verified. Use as an
internal color target only. Do not publish, redistribute, or reproduce the source artwork.

**Status:** Ready-to-paste prompt package. No generation has been executed.

**Production split:**

- Part 1: images `01–15` — visual system, hero frames, first food set.
- Part 2: images `16–30` plus video `31` — remaining food, environment, people, CTA, hero motion.

This is a fictional test campaign. Generated interiors, dishes and people must be labeled concept media and must not be presented as evidence of a real restaurant.

## How to run it

1. Create a new Google Flow project: `SAVRA_WEBSITE_MEDIA_C02_PALETTE_LOCKED`.
2. Upload the supplied palette image to the project and save it as the reusable
   reference `@SavraPalette`. Use it only for color relationships—not its lettering,
   icon, labels, or four-panel composition.
3. Turn on Flow Agent.
4. Paste the complete contents of
   [GOOGLE-FLOW-SAVRA-AGENT-INSTRUCTION.txt](./GOOGLE-FLOW-SAVRA-AGENT-INSTRUCTION.txt)
   into the project-level **Agent Instructions** field.
5. Keep **Confirm before generating → Always**.
6. Paste **Part 1 Master Prompt**.
7. Review the plan returned by Flow. It must not generate yet.
8. Send the exact **Execute Part 1** command.
9. Confirm all files `01–15` exist. Save `01`, `02`, `05`, and `06` to the project as reusable references.
10. Paste **Part 2 Master Prompt** in the same Flow project and Agent session.
11. Review its plan.
12. Send the exact **Execute Part 2** command.
13. If Flow stops because of a quota or generation failure, use the resume command at the end. Never regenerate completed IDs automatically.

Do not paste both master prompts at once. The two-stage split is intentional.

---

# Part 1 Master Prompt — images 01–15

Copy everything inside the following block into Google Flow Agent.

```text
You are the media production director for a fictional premium restaurant website concept.
Your task has two phases: PLAN, then EXECUTE. You are currently in PLAN phase.

Do not generate media yet. First return a detailed implementation plan for exactly 15
images, IDs 01–15 below. The plan must show, for every ID: filename, page purpose, image
mode, orientation, references required, complete generation prompt, acceptance criteria,
and the Collection where it will be stored. End your response with: READY FOR EXECUTE PART 1.

After I send the exact command EXECUTE PART 1, generate exactly one output for every ID
01–15 as one coordinated production batch. Do not create extra variations. Do not omit,
combine, replace, renumber, or silently retry an ID. If one generation fails, continue
with the remaining IDs and report the failed ID at the end. Generated files must be saved
and named with their specified filenames.

PROJECT
SAVRA is a fictional contemporary fire-led Eastern Mediterranean restaurant concept in
Vienna. Positioning: a nocturnal dining ritual shaped by smoke, mineral heat, and precise
seasonal plates. Service style: intimate tasting menu. This is synthetic concept media,
not evidence of a real venue, chef, clientele, menu, award, or business.

VISUAL WORLD — RETRO-FUTURE EMBER SALON
One coherent contemporary restaurant presented as a living still life. The mood combines
Viennese late-modern restraint with Eastern Mediterranean warmth: sculptural plaster,
stained oak, matte lacquer, honed stone, hand-blown glass, tactile linen and controlled
directional practical light. Precise European editorial photography, tactile realism,
soft highlight rolloff and restrained 35 mm grain. The result is confident, intimate and
slightly retro—never nostalgic kitsch, generic hotel luxury, rustic taverna or theme set.

AUTHORITATIVE PALETTE REFERENCE
Use the uploaded project reference @SavraPalette for color only. Do not reproduce its
lettering, icon, color names, hex labels, four-quadrant grid, graphic layout or texture.
The reference image is an internal production control and must never appear in output.

ABSOLUTELY LOCKED FOUR-COLOR PALETTE
1. Hunyadi Yellow #E09F3E — fire glow, small glazed accents and selected metal details.
2. Auburn #9E2A2B — lacquer panels, limited upholstery and high-impact focal surfaces.
3. Dark Slate Gray #335C67 — dominant walls, stained oak, honed stone and deep shadows.
4. Vanilla #FFF3B0 — linen, handmade ceramics and the softest illuminated highlights.

Target visual proportion across every environmental frame: approximately 55% Dark Slate
Gray, 20% Auburn, 15% Vanilla and 10% Hunyadi Yellow. Dark Slate Gray is the dominant dark;
Vanilla is the dominant light. Hunyadi Yellow is an accent, not a full-frame wash. Auburn
must remain clearly red-brown and must never shift to magenta. Treat these hex values as
the authoritative art-direction targets even though physically realistic photography
will contain tonal variations, reflections and shadows.

COLOR ENFORCEMENT
All deliberately designed architecture, furniture, tableware, textiles, staff wardrobe,
props and practical-light color must belong to the locked four-color family. Natural food,
skin and flame may retain physically truthful local color, but grade them harmoniously and
never let a natural color become a competing brand accent. Herb green may appear only as
an ingredient and must remain muted. Exterior blue-hour shadows must resolve toward Dark
Slate Gray #335C67, not cyan or navy. Warm light must resolve toward Hunyadi Yellow
#E09F3E or Vanilla #FFF3B0, not orange. Avoid pure black and pure white except tiny physical
speculars or occlusion shadows. No fifth accent color may be introduced.

MATERIAL MAPPING
Dark Slate Gray stained oak and honed stone; Auburn matte lacquer and leather; Hunyadi
Yellow glazed tile, selected powder-coated metal and light pools; Vanilla linen, ceramics
and diffusers. Metals are brushed and color-integrated, never chrome. Glass is lightly
smoked toward Dark Slate Gray, never green or blue.

CONTINUITY RULES
Every output must depict the same restaurant, architecture, four-color palette, materials, furniture,
tableware family, lighting logic, time of day, color grade, grain, and photographic
campaign. Use accepted outputs from earlier IDs as project references for later IDs.
The room has low ceilings, a long central aisle, five Dark Slate Gray honed-stone tables,
Dark Slate Gray stained-oak chairs with limited Auburn leather, Auburn lacquer wall panels,
small Hunyadi Yellow glazed details, Dark Slate Gray smoked-glass lamps, and Vanilla linen
and ceramics. Do not change the number, design, color assignment or arrangement of major
architectural and furniture elements between related images.

WEBSITE COMPOSITION RULES
Create decisive compositions with protected negative space for interface typography.
Keep hero subjects inside the central 55 percent so desktop media can survive responsive
cropping. Portrait assets must be recomposed natively, never generated as crude crops.
No typography, menu text, prices, logos, signage, borders, UI, split screens, collages,
or graphic overlays may be baked into any image. The website adds all text separately.

PEOPLE AND TRUTH RULES
No identifiable customers. The chef is an anonymous synthetic placeholder shown only
from behind, in silhouette, in profile with face obscured, or through hands. No celebrity
likeness. No fake award, press quote, certification, or factual business claim.

GLOBAL EXCLUSIONS
Exclude any fifth designed color; beige, tan, brown, emerald, cobalt, violet, pink, bright
orange, cyan, navy, cream outside Vanilla, and gray outside Dark Slate Gray. Also exclude
orange-and-teal blockbuster grading, neon cyberpunk, magenta or cyan light,
glossy CGI, fantasy architecture, floating objects, excessive steam, impossible fire,
rubbery food, text artifacts, watermarks, readable labels, visible alcohol brands,
celebrity likenesses, generic stock smiles, distorted hands, extra fingers, duplicated
utensils, changing plate geometry, duplicated chairs, impossible reflections, lens flare,
heavy bloom, crushed black detail, and over-shallow focus that hides the subject.

FOOD DEFINITIONS
DISH 01 — ember-roasted aubergine with tahini, pomegranate molasses, toasted sesame,
parsley and restrained sumac, served on a low handmade Vanilla ceramic plate.
DISH 02 — charcoal sea bass with preserved lemon, shaved fennel, herbs and smoked olive
oil, served on an oval Dark Slate Gray ceramic plate.
DISH 03 — slow-cooked lamb shoulder with sour-cherry glaze, freekeh and one charred onion,
served on a wide Dark Slate Gray ceramic plate.

OUTPUT RULES
Generate the highest image quality available. One output per ID. Keep each output in its
named Collection. Preserve generation history. Use the exact filename stem. Do not add
text to the image. For each output, record the model displayed by Flow and whether any
reference image was used.

COLLECTIONS
01_STYLE_ANCHORS
02_HERO_FRAMES
03_HERO_PORTRAIT
04_FOOD
08_REJECTED
09_FINALS

PALETTE QA FOR EVERY OUTPUT
Before accepting an output, compare it with @SavraPalette and report PASS or FAIL for:
(a) the four exact named colors remain the only designed palette; (b) Dark Slate Gray is
dominant and Vanilla is the light anchor; (c) Hunyadi Yellow remains a limited accent;
(d) Auburn remains red-brown rather than magenta; (e) natural food, skin and flame colors
are truthful but subordinate; and (f) no palette-reference typography, icon or quadrant
graphic appears. Any failed item makes the output failed. Do not silently regenerate it.

ASSET 01
Filename: savra_01_world-threshold_16x9_v01
Collection: 01_STYLE_ANCHORS
Orientation: 16:9
Purpose: campaign world anchor and architectural reference.
Prompt: An eye-level view from just outside SAVRA at blue hour, using @SavraPalette for
color relationships only. A nearly closed Dark Slate Gray stained-oak threshold with a
restrained Auburn lacquer reveal and Hunyadi Yellow handle detail opens toward one precisely
prepared Dark Slate Gray honed-stone table with Vanilla linen inside. Strong
depth corridor, exact verticals, restrained 35 mm lens character, Dark Slate Gray negative space in
the upper left and lower right, central mobile-safe axis. Hunyadi Yellow motivated interior
light against Dark Slate Gray exterior shadow. No people, signage, logo, text, vehicles, fifth color, fantasy
architecture or hotel-lobby styling.
Acceptance: plausible buildable restaurant, coherent materials, readable shadow detail,
useful negative space, no text or geometry defects.

ASSET 02
Filename: savra_02_world-dining-room_16x9_v01
Collection: 01_STYLE_ANCHORS
Orientation: 16:9
Purpose: authoritative interior continuity reference.
Prompt: SAVRA dining room before service, using @SavraPalette for color relationships only,
seen from shoulder height with 40 mm editorial architectural lens character. Five precisely
spaced Dark Slate Gray honed-stone tables, Dark Slate Gray stained-oak chairs with limited
Auburn leather, Auburn lacquer wall panels, restrained Hunyadi Yellow glazed details,
Dark Slate Gray smoked-glass table lamps, Vanilla diffusers and Vanilla linen.
One foreground table sits asymmetrically; a long central aisle establishes depth. Quiet
negative space across the upper third. Exact structural lines and realistic spacing.
No people, food, signs, flowers, text, duplicated furniture, unexplained colored light or
fifth designed color. Enforce the 55/20/15/10 palette proportion.
Acceptance: must plausibly be the interior behind asset 01 and become the project’s
authoritative interior reference.

ASSET 03
Filename: savra_03_world-dish-anchor_16x9_v01
Collection: 01_STYLE_ANCHORS
Orientation: 16:9
Purpose: authoritative food-photography reference.
Prompt: DISH 01 photographed as a quiet edible landscape on one SAVRA Dark Slate Gray
honed-stone table, using @SavraPalette for all designed surfaces. Low handmade Vanilla
ceramic plate, faithful aubergine, tahini, pomegranate molasses,
sesame, parsley and restrained sumac. 50 mm three-quarter editorial food photography,
entire dish legible, one soft directional source, realistic moisture and sauce viscosity,
gentle controlled speculars, Vanilla highlights, Dark Slate Gray negative space. One optional
Dark Slate Gray smoked glass at the far edge. Natural ingredient colors remain truthful but
subordinate. No invented garnish, fake steam, hands, floating food, commercial
advertising gloss, text or branding.
Acceptance: recognizably edible, anatomically and materially correct, consistent with
assets 01–02, enough depth of field to understand the dish.

ASSET 04
Filename: savra_04_world-human-process_16x9_v01
Collection: 01_STYLE_ANCHORS
Orientation: 16:9
Purpose: human craft reference.
Prompt: Anonymous chef shown over the shoulder at the SAVRA pass, finishing DISH 01.
One hand steadies the plate; the other places one final parsley leaf with tweezers.
Natural working posture, no performance for camera. Close observational 50 mm editorial
photography, hands and plate in the lower central area, upper-left negative space, Hunyadi
Yellow task light and deep preserved Dark Slate Gray shadows. Same Auburn lacquer,
Dark Slate Gray stained-oak, Vanilla ceramic and locked four-color world.
No visible face, direct smile, white studio kitchen, extra fingers, duplicated tools,
flame, excessive steam, text or logo.
Acceptance: natural believable gesture, correct hands, stable plate and food geometry,
same campaign grade as assets 01–03.

ASSET 05
Filename: savra_05_hero-start-wide_16x9_v01
Collection: 02_HERO_FRAMES
Orientation: 16:9
References: use assets 01 and 02 as authoritative visual references.
Purpose: hero-video start frame and desktop reduced-motion poster.
Prompt: The final hero opening frame outside the exact SAVRA threshold from asset 01.
Camera at eye level; entrance almost closed; narrow view toward one prepared table inside.
Preserve exact restaurant geometry, locked four-color material palette, furniture, time
of day, light and grade from assets 01–02. Central 55 percent remains compositionally safe.
Controlled Dark Slate Gray
negative space for hero copy. No people, text, logo, signage, new props or new materials.
Acceptance: exact continuity with assets 01–02 and a strong standalone hero poster.

ASSET 06
Filename: savra_06_hero-end-wide_16x9_v01
Collection: 02_HERO_FRAMES
Orientation: 16:9
References: use assets 02 and 05.
Purpose: hero-video end frame.
Prompt: The exact same SAVRA restaurant, threshold, time, furniture, tableware, lighting
and grade as asset 05, now viewed after the camera has moved through the doorway and
stopped inside. One prepared table is the destination. Maintain physically plausible
spatial continuity from asset 05 and preserve Dark Slate Gray negative space above the table.
No people, text, menu, logo, floating objects, changed chair count or changed geometry.
Acceptance: must form a credible continuous camera path with asset 05.

ASSET 07
Filename: savra_07_hero-start-portrait_9x16_v01
Collection: 03_HERO_PORTRAIT
Orientation: 9:16
References: use assets 02 and 05.
Purpose: mobile hero opening poster.
Prompt: Portrait-native recomposition of asset 05, not a crop. Preserve the exact SAVRA
threshold, room, materials, light and grade. Place doorway and destination table on the
central vertical axis. Protect negative space above and below for mobile interface copy.
No new objects, people, text, logo, signage or restaging.
Acceptance: looks intentionally composed for a phone and remains the same room.

ASSET 08
Filename: savra_08_hero-end-portrait_9x16_v01
Collection: 03_HERO_PORTRAIT
Orientation: 9:16
References: use assets 02, 06 and 07.
Purpose: mobile hero closing poster.
Prompt: Portrait-native end frame matching asset 07 after a physically plausible move
through the threshold. Same room, materials, furniture, tableware, lighting, grade and
object count. Destination table sits in the lower central half with quiet space above.
No new props, people, text, logo or geometry change.
Acceptance: credible portrait continuity between assets 07 and 08.

ASSET 09
Filename: savra_09_hero-mobile-poster_9x16_v01
Collection: 03_HERO_PORTRAIT
Orientation: 9:16
References: use assets 07 and 08.
Purpose: primary static mobile hero fallback.
Prompt: A decisive portrait hero poster for SAVRA at the midpoint between assets 07 and
08: the threshold frames the prepared destination table. Exact continuity of room,
materials, lighting and grade. Strong vertical depth, protected Dark Slate Gray upper region for
headline, clear lower region for reservation control. No people, text, logo or new props.
Acceptance: complete static composition that communicates arrival without motion.

ASSET 10
Filename: savra_10_hero-desktop-poster_16x9_v01
Collection: 02_HERO_FRAMES
Orientation: 16:9
References: use assets 05 and 06.
Purpose: alternate desktop poster and preload state.
Prompt: A high-fidelity midpoint frame between assets 05 and 06. Camera just crossing the
SAVRA threshold, destination table visible, exact architecture and object continuity,
rich Dark Slate Gray shadow detail and protected left-side negative space. No motion blur, people, text,
logo, changed furniture or new objects.
Acceptance: sharp preload poster, consistent enough to bridge start and end frames.

ASSET 11
Filename: savra_11_dish01-portrait_4x5_v01
Collection: 04_FOOD
Orientation: 4:5
References: use assets 02 and 03.
Purpose: first signature-dish portrait.
Prompt: DISH 01 faithfully recreated from asset 03 in a portrait-native 4:5 composition.
Plate fully visible, offset low, upper-right negative space for metadata, exact ingredients
and garnish count, same table, directional light, exact four-color palette, grade and grain. No invented
ingredients, extra garnish, fake steam, hands, text, logo or plate deformation.
Acceptance: edible fidelity and campaign continuity.

ASSET 12
Filename: savra_12_dish01-landscape_3x2_v01
Collection: 04_FOOD
Orientation: 3:2
References: use assets 03 and 11.
Purpose: wide dish transition image.
Prompt: DISH 01 in a low 3:2 landscape editorial composition. Preserve exact food, plate,
garnish count, light and table world. Plate placed on the right third, broad Dark Slate Gray negative
space on the left for copy. No new props except one restrained Vanilla linen edge.
Acceptance: same dish identity as assets 03 and 11, no food or ceramic defects.

ASSET 13
Filename: savra_13_dish02-portrait_4x5_v01
Collection: 04_FOOD
Orientation: 4:5
References: use assets 02 and 03 for visual language.
Purpose: second signature-dish portrait.
Prompt: DISH 02 — charcoal sea bass, preserved lemon, shaved fennel, herbs and smoked
olive oil on an oval Dark Slate Gray ceramic plate. Portrait 4:5, three-quarter 50 mm editorial
food photography, plate fully legible, negative space above, one motivated directional
source, accurate fish and garnish texture, SAVRA table and campaign grade. No extra garnish,
fake steam, floating food, deformed fish, text or branding.
Acceptance: realistic edible fish, stable plate and exact campaign continuity.

ASSET 14
Filename: savra_14_dish02-overhead_3x2_v01
Collection: 04_FOOD
Orientation: 3:2
References: use asset 13.
Purpose: overhead dish detail.
Prompt: Exact DISH 02 from asset 13 photographed overhead in 3:2. Preserve the same plate,
portion, lemon, fennel, herbs, oil placement, table material, palette and grade. Dish sits
on the left third with Dark Slate Gray copy space on the right. No additional objects, hands, text,
changed garnish or distorted plate ellipse.
Acceptance: authoritative continuity with asset 13.

ASSET 15
Filename: savra_15_dish03-portrait_4x5_v01
Collection: 04_FOOD
Orientation: 4:5
References: use assets 02 and 03 for visual language.
Purpose: third signature-dish portrait.
Prompt: DISH 03 — slow-cooked lamb shoulder with restrained sour-cherry glaze, freekeh
and one charred onion on a wide Dark Slate Gray ceramic plate. Portrait 4:5,
three-quarter editorial food photography, enough focus to understand the lamb texture,
accurate sauce viscosity, offset composition and upper-left negative space. Same SAVRA
light, table, grade and grain. No extra garnish, fake steam, raw meat appearance, floating
food, text, logo or plate deformation.
Acceptance: edible, plausible and consistent with food assets 03 and 11–14.

PLAN RESPONSE REQUIREMENTS
Return a concise but complete table for all IDs 01–15, followed by the exact generation
prompts you will use. Add a Palette Use column naming the dominant and accent colors for
each asset. Verify there are exactly 15 image outputs and zero video outputs.
Do not generate anything during PLAN phase.
```

## Execute Part 1 command

Send only after the returned plan is correct:

```text
EXECUTE PART 1 — Generate exactly images 01–15 from the approved plan, one output per ID.
Use the specified filenames and Collections. Continue past isolated failures, never create
extra variations, and finish with a completion table listing every ID as completed or failed
plus Palette QA PASS/FAIL. Never silently regenerate a palette failure.
```

---

# Part 2 Master Prompt — images 16–30 and video 31

Paste this only after Part 1 has completed in the same Flow project.

```text
Continue the SAVRA_WEBSITE_MEDIA_C02_PALETTE_LOCKED campaign in the same Google Flow project. Your task
again has two phases: PLAN, then EXECUTE. You are currently in PLAN phase.

Do not generate media yet. First inspect the completed Part 1 assets and return a detailed
implementation plan for exactly 15 images, IDs 16–30, and exactly one video, ID 31. For
every ID show filename, page purpose, generation mode, orientation, duration for video,
project references, full prompt, acceptance criteria, and target Collection. End your
response with: READY FOR EXECUTE PART 2.

After I send the exact command EXECUTE PART 2, generate exactly one output for every ID
16–31 as one coordinated production batch: 15 images and one video. Do not create extra
variations. Do not omit, combine, replace, renumber, or silently retry an ID. Continue
past isolated failures and report them at the end. Never regenerate IDs 01–15.

AUTHORITATIVE PART 1 REFERENCES
Asset 01 = world threshold reference.
Asset 02 = authoritative interior reference. Save/use it as @InteriorAnchor.
Asset 03 = authoritative food-photography reference. Save/use it as @FoodAnchor.
Asset 04 = human-process reference.
Asset 05 = hero-video start frame.
Asset 06 = hero-video end frame.
Assets 07–10 = mobile and desktop hero poster references.
Assets 11–15 = approved food campaign references.

Do not redesign SAVRA. Preserve the exact Retro-Future Ember Salon established in Part 1
and use @SavraPalette for color relationships only. The locked colors remain Hunyadi
Yellow #E09F3E, Auburn #9E2A2B, Dark Slate Gray #335C67 and Vanilla #FFF3B0, at the
environmental target proportion of approximately 10/20/55/15. Preserve the precise
European editorial photography, tactile materials, controlled motivated light, readable
Dark Slate Gray shadows, soft highlight rolloff and restrained 35 mm grain.

All designed architecture, furniture, tableware, textiles, wardrobe, props and practical
light must remain within those four color families. Natural food, skin and flame retain
truthful local color but remain subordinate. Do not copy any lettering, icon, labels, hex
text, quadrant layout or graphic expression from @SavraPalette. Do not introduce a fifth
accent color. Exterior shadows resolve toward Dark Slate Gray, and warm illumination
resolves toward Hunyadi Yellow or Vanilla.

Maintain all Part 1 truth and exclusions: no embedded text, menus, logos, signage, UI,
fake awards, business claims, identifiable customers, celebrity likenesses, generic stock
smiles, neon, orange-and-teal grading, glossy CGI, floating objects, excessive steam,
distorted hands, duplicated objects, unstable architecture or impossible reflections.
Also reject beige, tan, brown, emerald, cobalt, violet, pink, bright orange, cyan, navy,
off-palette cream, off-palette gray, chrome and unexplained colored light.

ADDITIONAL FOOD DEFINITIONS
DISH 04 — salt-baked beetroot with black garlic, labneh, dill oil and toasted hazelnut,
served on a shallow Dark Slate Gray ceramic plate.
DISH 05 — saffron-poached quince with sheep’s-milk yogurt, pistachio and a thin sesame
crisp, served in a low Vanilla ceramic bowl.
DISH 06 — blistered flatbread with za’atar, green olive oil and smoked cultured butter,
served on a Dark Slate Gray oval ceramic platter.

OUTPUT RULES
Highest quality available for the requested mode. One output per ID. Exact filename stem.
Use completed Part 1 assets as project references. Record the model and reference mode.
No automatic retries or additional variations.

COLLECTIONS
04_FOOD
05_INTERIOR
06_CHEF_PROCESS
07_RESERVATION
02_HERO_FRAMES
08_REJECTED
09_FINALS

PALETTE QA FOR EVERY OUTPUT
Apply the same Part 1 palette test to every asset, including every video frame: four-color
designed palette only; Dark Slate Gray dominant; Vanilla light anchor; Hunyadi Yellow
limited; Auburn red-brown; natural subject colors subordinate; no copied palette artwork.
Report PASS or FAIL in the completion table. A palette failure is a failed asset and must
not be silently regenerated.

ASSET 16
Filename: savra_16_dish03-landscape_3x2_v01
Collection: 04_FOOD
Orientation: 3:2
References: asset 15 and @FoodAnchor.
Purpose: landscape continuation for DISH 03.
Prompt: Exact DISH 03 from asset 15 in a low 3:2 landscape composition. Preserve lamb,
cherry glaze, freekeh, single charred onion, plate, light, table, grade and garnish count.
Plate on the left third, broad Dark Slate Gray negative space on the right. No added props, food,
steam, hands, text or geometry changes.
Acceptance: unquestionable identity match with asset 15.

ASSET 17
Filename: savra_17_dish04-portrait_4x5_v01
Collection: 04_FOOD
Orientation: 4:5
References: @FoodAnchor and asset 02.
Purpose: fourth signature-dish portrait.
Prompt: DISH 04 — salt-baked beetroot, black garlic, labneh, dill oil and toasted hazelnut
on a shallow Dark Slate Gray ceramic plate. Portrait 4:5, three-quarter editorial food image,
precise portion, restrained garnish, accurate beet and labneh texture, upper-right negative
space, SAVRA light, table and grade. No extra ingredients, fake steam, text or branding.
Acceptance: edible realism, campaign continuity, no plate or food defects.

ASSET 18
Filename: savra_18_dish04-overhead_3x2_v01
Collection: 04_FOOD
Orientation: 3:2
References: asset 17.
Purpose: overhead continuation for DISH 04.
Prompt: Exact DISH 04 from asset 17 viewed overhead in 3:2. Preserve plate, portion,
ingredient positions, garnish count, light, table, palette and grade. Plate on right third,
left-side copy space. No additional props, hands, text or restaging.
Acceptance: authoritative continuity with asset 17.

ASSET 19
Filename: savra_19_dish05-portrait_4x5_v01
Collection: 04_FOOD
Orientation: 4:5
References: @FoodAnchor and asset 02.
Purpose: dessert portrait.
Prompt: DISH 05 — saffron-poached quince, sheep’s-milk yogurt, pistachio and one thin sesame
crisp in a low Vanilla ceramic bowl. Portrait 4:5, refined three-quarter editorial image,
accurate fruit and yogurt texture, crisp structurally plausible, Vanilla highlights and
upper-left negative space, SAVRA table and grade. No extra fruit, flowers, melting bowl,
fake steam, text or commercial dessert gloss.
Acceptance: edible, restrained, structurally correct dessert.

ASSET 20
Filename: savra_20_dish05-landscape_3x2_v01
Collection: 04_FOOD
Orientation: 3:2
References: asset 19.
Purpose: dessert landscape transition.
Prompt: Exact DISH 05 from asset 19 in a low 3:2 landscape. Preserve quince, yogurt,
pistachio, one sesame crisp, bowl, light, table, grade and portion. Bowl offset left with
quiet Dark Slate Gray right-side copy space. No new props, garnish, hands, text or geometry change.
Acceptance: exact identity continuity with asset 19.

ASSET 21
Filename: savra_21_dish06-portrait_4x5_v01
Collection: 04_FOOD
Orientation: 4:5
References: @FoodAnchor and asset 02.
Purpose: bread ritual portrait.
Prompt: DISH 06 — blistered flatbread with za’atar, green olive oil and smoked cultured
butter on a Dark Slate Gray oval ceramic platter. Portrait 4:5, overhead-leaning editorial composition,
realistic blistered bread, restrained oil, small butter vessel, protected upper copy space,
SAVRA light and grade. No excessive flour, floating herbs, extra dishes, hands, text or logo.
Acceptance: realistic bread texture, stable platter and coherent campaign light.

ASSET 22
Filename: savra_22_dish06-overhead_3x2_v01
Collection: 04_FOOD
Orientation: 3:2
References: asset 21.
Purpose: overhead bread-sharing image.
Prompt: Exact DISH 06 from asset 21 overhead in 3:2. Preserve bread shape, blister pattern,
za’atar, oil, butter vessel, platter and campaign grade. Platter crosses the lower-right
third; large Dark Slate Gray upper-left negative space. No hands, added tableware, text or restaging.
Acceptance: exact continuity with asset 21 and useful copy space.

ASSET 23
Filename: savra_23_interior-deep-wide_16x9_v01
Collection: 05_INTERIOR
Orientation: 16:9
References: assets 01, 02 and 06.
Purpose: immersive restaurant atmosphere section.
Prompt: A deeper 16:9 architectural editorial view into the exact SAVRA dining room from
asset 02, before service. Preserve five Dark Slate Gray honed-stone tables, Dark Slate Gray
stained-oak chairs with limited Auburn leather, Auburn lacquer panels, restrained Hunyadi
Yellow glazed accents, Dark Slate Gray smoked-glass lamps, Vanilla diffusers and linen,
practical-light positions, exact palette proportions and grade.
40 mm shoulder-height perspective, straight structural lines, foreground threshold and
quiet copy space. No people, food, text, duplicated furniture, new decor or fifth color.
Acceptance: clearly the same room, physically correct, rich but readable shadow detail.

ASSET 24
Filename: savra_24_exterior-arrival_3x2_v01
Collection: 05_INTERIOR
Orientation: 3:2
References: assets 01 and 05.
Purpose: location and arrival section.
Prompt: Exterior arrival at the fictional SAVRA threshold on a quiet Vienna side street
at blue hour. Entrance materials and interior view match assets 01 and 05 exactly. Exterior
shadows grade toward Dark Slate Gray; the interior glow remains Hunyadi Yellow and Vanilla.
Restrained
Viennese urban texture without famous landmarks or readable signs. One distant anonymous
silhouette may pass. Negative space around entrance. No logo, fake signage, luxury car,
crowd, rain cliché, neon, lens flare, visible face or fifth accent color.
Acceptance: credible location atmosphere without implying a real address.

ASSET 25
Filename: savra_25_table-detail_4x5_v01
Collection: 05_INTERIOR
Orientation: 4:5
References: assets 02 and 23.
Purpose: material and service-detail image.
Prompt: One prepared SAVRA table in 4:5. Tactile Vanilla linen, Dark Slate Gray smoked
glass, brushed Dark Slate Gray cutlery, handmade Vanilla ceramic and Dark Slate Gray
honed stone. Hunyadi Yellow directional practical light with a restrained Auburn background,
realistic reflections, focus deep enough to understand the setting, quiet background.
No food, menu, logo, flowers, duplicated utensils, floating glassware, wedding styling or fifth color.
Acceptance: correct table geometry and exact campaign materials.

ASSET 26
Filename: savra_26_material-macro_3x2_v01
Collection: 05_INTERIOR
Orientation: 3:2
References: assets 02 and 23.
Purpose: transition texture and close visual detail.
Prompt: A close 3:2 architectural study inside SAVRA where Dark Slate Gray honed stone and
stained oak, Auburn matte lacquer, a small Hunyadi Yellow glazed-metal detail and Vanilla
linen meet. Physically correct junctions, realistic wear,
motivated grazing light, restrained grain, strong abstract rhythm while remaining real.
No people, products, text, liquid metal, impossible joints, neon, CGI gloss or fifth color.
Acceptance: material truth, coherent scale and same light/grade as the room.

ASSET 27
Filename: savra_27_chef-placeholder_3x4_v01
Collection: 06_CHEF_PROCESS
Orientation: 3:4
References: assets 02 and 04.
Purpose: synthetic chef-story placeholder for later replacement.
Prompt: Anonymous synthetic chef in three-quarter profile with face obscured by shadow,
inside the exact SAVRA pass. Calm concentration, natural posture,
hands relaxed and anatomically correct, 50 mm environmental editorial portrait, warm task
light resolving toward Hunyadi Yellow and Vanilla, Auburn lacquer and Dark Slate Gray
background, negative space on right. Dark Slate Gray unbranded workwear. No identifiable real
person, celebrity likeness, direct gaze, smile-for-camera, text, logo or extra fingers.
Acceptance: clearly a concept placeholder, natural and consistent with asset 04.

ASSET 28
Filename: savra_28_plating-process-still_16x9_v01
Collection: 06_CHEF_PROCESS
Orientation: 16:9
References: assets 04, 11 and 27.
Purpose: pinned craft-section image.
Prompt: The anonymous SAVRA chef completes one exact plating gesture on DISH 01 at the
same pass as asset 04. One hand steadies the plate, the other holds tweezers above one
final parsley leaf. 50 mm close observational view, hands and dish central-lower, protected
upper-left negative space, same light and grade. No face, extra fingers, duplicated tools,
floating garnish, flame, steam, food morphing, text or logo.
Acceptance: correct hands and faithful dish continuity with asset 11.

ASSET 29
Filename: savra_29_reservation-wide_16x9_v01
Collection: 07_RESERVATION
Orientation: 16:9
References: assets 02, 23 and 25.
Purpose: final reservation call to action.
Prompt: One empty SAVRA table prepared for two, viewed from the threshold after setup.
The composition communicates anticipation rather than absence. Exact room, furniture,
tableware, locked four-color materials, light and grade from references. Broad quiet Dark Slate Gray region on left
for reservation copy. No people, food, menu, text, logo, flowers, champagne cliché,
engagement styling or hotel gloss.
Acceptance: emotionally inviting, compositionally quiet and unmistakably the same room.

ASSET 30
Filename: savra_30_reservation-portrait_4x5_v01
Collection: 07_RESERVATION
Orientation: 4:5
References: asset 29 and assets 02/25.
Purpose: mobile reservation call to action.
Prompt: Portrait-native recomposition of asset 29, not a crop. Same SAVRA table for two,
room, furniture, tableware, locked four-color materials, lighting and grade. Table in lower half, broad Dark Slate Gray
negative space above for copy and reservation control. No new props, people, food, text,
logo or restaging.
Acceptance: exact scene continuity and intentional mobile composition.

ASSET 31
Filename: savra_31_hero-threshold-dolly_16x9_8s_v01
Collection: 02_HERO_FRAMES
Type: VIDEO
Orientation: 16:9
Duration: 8 seconds initially.
Generation mode: first-and-last Frames if the active model supports it.
Start frame: asset 05.
End frame: asset 06.
Purpose: primary GSAP ScrollTrigger hero video.
Prompt: One unbroken, extremely controlled forward dolly through the exact SAVRA threshold
from supplied start frame 05 to supplied end frame 06. Slow, linear, physically plausible
precision-track move. The threshold opens only as needed for the camera. Architecture,
walls, furniture, chair count, reflections, table setting, lamps, light direction, exposure,
color grade and object count remain perfectly stable. First and final moments settle cleanly
for scroll holds. No cut, transition, speed ramp, time lapse, orbit, handheld motion, focus
pulse, exposure flicker, breathing walls, geometry warping, moving cutlery, people, smoke,
particles, text, logo, added signage or impossible reflection. Muted visual storytelling;
no audio-dependent action.
Acceptance: one coherent camera path, strong frame-to-frame identity, no spatial morph,
flicker or object mutation, start/end closely match supplied frames, usable when scrubbed
forward and backward, and static poster assets 05/06 remain valid reduced-motion fallbacks.

PLAN RESPONSE REQUIREMENTS
Return a complete table for IDs 16–31 followed by the exact prompts you will use. Verify
the output count is exactly 15 images and one video. Verify video 31 uses frames 05 and 06
and that no completed Part 1 asset will be regenerated. Add a Palette Use column naming
dominant and accent colors for each asset. Do not generate during PLAN phase.
```

## Execute Part 2 command

Send only after the returned plan is correct:

```text
EXECUTE PART 2 — Generate exactly images 16–30 and video 31 from the approved plan,
one output per ID. Reuse the completed Part 1 references, preserve the exact filenames and
Collections, continue past isolated failures, never regenerate IDs 01–15, never create
extra variations, and finish with a completion table listing every ID as completed or failed
plus Palette QA PASS/FAIL. Never silently regenerate a palette failure.
```

## Resume missing generations

Use this only if Flow stops partway through a batch:

```text
RESUME MISSING IDS ONLY — Inspect the SAVRA_WEBSITE_MEDIA_C02_PALETTE_LOCKED project and completion table.
List which requested IDs in the current Part are already complete and do not regenerate them.
Generate only these missing or failed IDs: [INSERT IDS]. Use their original approved prompts,
filenames, references and Collections. Produce one output per missing ID and return an updated
completion table. Do not create variations or modify completed assets.
```

## Final expected inventory

| Output | Count |
| --- | ---: |
| Style/world images | 4 |
| Hero frames and posters | 6 |
| Food images | 12 |
| Interior/material images | 4 |
| Chef/process images | 2 |
| Reservation images | 2 |
| Hero video | 1 |
| **Total** | **31** |

For detailed acceptance, refinement and provenance instructions, use [GOOGLE-FLOW-RESTAURANT-MEDIA-GUIDE.md](./GOOGLE-FLOW-RESTAURANT-MEDIA-GUIDE.md).

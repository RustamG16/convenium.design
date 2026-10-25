# Google Flow media generation guide — restaurant concept 01

**Status:** Prompt and production package only. No media has been generated or approved.

**Purpose:** Produce a coherent image and video system for a premium, scroll-animated, single-page restaurant website. The first website experiment will use `awwwards-web-design`, `impeccable`, `gsap-core`, and `gsap-scrolltrigger`; this media package is prepared separately with `asset-director`.

**Last documentation check:** 2026-08-10.

## 1. Current Google Flow workflow

Use Google Flow on desktop. Current official documentation says Flow can create video from text, ingredients, start/end frames, and other videos. It also provides a project-specific Agent that can plan, batch-generate, edit, organize assets, and store project-wide Agent Instructions.

Model and feature availability varies by region and can change. Before every generation, open the model settings and confirm that the selected model supports the requested combination of:

- Image or video generation;
- 16:9 or 9:16 orientation;
- requested duration;
- text-to-video, Ingredients, first frame, or first-and-last frames;
- video editing or extension.

Recommended routing:

- Use an available fast model for composition and motion tests.
- Use the highest-quality model that supports the chosen input mode for accepted finals.
- Use Gemini Omni Flash when editing an uploaded/generated clip or when a supported 10-second generation is genuinely needed.
- Use first-and-last frames for controlled scroll-scrub shots when the active model supports them.
- Use Ingredients when identity, dish, material, wardrobe, or location continuity matters.
- Extend only an already accepted Veo clip. Do not extend a failed composition.

Google’s current help states that uploaded videos for Omni Flash editing may be up to 60 seconds and 1 GB in `.mov`, `.mp4`, `.avi`, or `.wmv`; uploads longer than 30 seconds must be trimmed, and an edit targets a segment up to 10 seconds. Feature availability remains region-dependent.

## 2. Credit and approval safety

In Flow Agent settings, keep **Confirm before generating → Always**. Agent conversations currently do not consume Flow credits, but generated media does. Never allow an exploratory conversation to silently become a large batch.

Generation order:

1. Create four style-anchor images only.
2. Approve one visual world.
3. Create the hero opening and closing frames.
4. Generate two hero-motion tests.
5. Approve the camera behavior.
6. Generate the remaining still set.
7. Generate secondary clips.
8. Run acceptance review before downloading finals.

Stop after each numbered approval point. Do not generate the full package from an unapproved look.

## 3. Complete these variables first

Replace every bracketed value before generation.

```text
[RESTAURANT_NAME] =
[CITY_COUNTRY] =
[CUISINE] =
[POSITIONING] = one truthful sentence
[SIGNATURE_DISH_01] =
[SIGNATURE_DISH_02] =
[SIGNATURE_DISH_03] =
[CHEF_NAME_OR_ROLE] =
[SERVICE_STYLE] = tasting menu / à la carte / casual fine dining / other
[PRIMARY_MATERIALS] =
[BRAND_COLORS] =
[DESIRED_TIME_OF_DAY] =
[REAL_INTERIOR_REFERENCE] = yes / no
[REAL_CHEF_REFERENCE] = yes / no
[REAL_DISH_REFERENCES] = yes / no
```

Default visual hypothesis for the first experiment:

```text
AFTER-HOURS RITUAL — a contemporary restaurant presented as a living still life.
Deep mineral shadows, oxblood lacquer, smoked glass, aged stainless steel,
charred wood and warm directional light. Precise European editorial photography,
tactile realism, restrained 35 mm grain, strong negative space, no lifestyle gloss.
```

Change this hypothesis before generating if it conflicts with the restaurant’s real cuisine, architecture, climate, price point, or brand.

## 4. Prepare Flow project references

Create a Flow project named:

```text
[RESTAURANT_NAME]_WEBSITE_MEDIA_C01
```

Create these Collections:

```text
00_REFERENCES
01_STYLE_ANCHORS
02_HERO_WIDE
03_HERO_PORTRAIT
04_FOOD
05_INTERIOR
06_CHEF_PROCESS
07_RESERVATION
08_REJECTED
09_FINALS
```

Upload only references you are authorized to use. Create clean Ingredients where possible:

- `@BrandPalette`: a simple color/material board without unrelated objects;
- `@InteriorAnchor`: the approved interior or style-anchor frame;
- `@Dish01`, `@Dish02`, `@Dish03`: real dishes isolated against simple backgrounds;
- `@Chef`: approved reference photos of the real chef, only with permission;
- `@Tableware`: the restaurant’s actual plate, glassware, linen, and cutlery;
- `@Logo`: approved logo artwork for reference only—do not ask the model to redraw it.

Google recommends plain or segmented backgrounds for subject/product Ingredients, consistent visual references, and text prompts that complement rather than contradict the uploaded inputs.

## 5. Project-wide Google Flow Agent Instruction

Turn on Flow Agent, open **Agent Instructions → Add instruction**, attach the approved brand/material board when available, and paste:

```text
You are producing a single coherent media campaign for [RESTAURANT_NAME], a [CUISINE]
restaurant in [CITY_COUNTRY]. The media will support one premium, scroll-animated website.

VISUAL WORLD
After-hours ritual: a contemporary restaurant presented as a living still life. Deep
mineral shadows, oxblood lacquer, smoked glass, aged stainless steel, charred wood,
warm directional light, precise European editorial photography, tactile realism,
restrained 35 mm grain, rich blacks with preserved detail, and soft highlight rolloff.

CONTINUITY
Keep one restaurant, one material palette, one lighting logic, one tableware family,
and one photographic grade across every image and clip. Treat attached Ingredients as
identity references, not loose inspiration. Preserve their proportions, materials,
colors, and distinguishing details.

COMPOSITION
Create decisive compositions with useful negative space for interface typography.
For video, use one continuous physically plausible camera move. Maintain stable
architecture, table geometry, food geometry, hands, faces, reflections, and object
count throughout the shot. Keep important subjects inside a mobile-safe central zone.

WEBSITE REQUIREMENTS
No typography, captions, menus, prices, logos, watermarks, UI, borders, split screens,
collages, or graphic overlays baked into the media. The website adds all text and brand
marks separately. Do not create fake press awards, customer claims, certifications,
or recognizable third-party branding.

PEOPLE
Natural working behavior, never generic stock smiles. No identifiable guest unless an
approved reference and release are provided. If no real chef reference is supplied,
show anonymous hands, silhouette, or over-shoulder process and label the asset as a
synthetic placeholder for later replacement.

EXCLUDE
Orange-and-teal blockbuster grading, neon cyberpunk, glossy CGI surfaces, fantasy
ingredients, impossible flames, floating objects, levitating plates, excessive steam,
distorted hands, duplicated utensils, rubbery food, over-shallow focus, text artifacts,
logos, celebrity likenesses, visible alcohol brands, and camera motion that warps space.

WORKING METHOD
Never spend credits without confirmation. For each requested asset, first restate the
input mode, model capability required, orientation, duration if video, attached
Ingredients or frames, number of variants, and acceptance criteria. Generate the
smallest requested batch. Keep rejected outputs in 08_REJECTED and accepted candidates
in the asset-specific Collection. Do not silently change the visual world.
```

## 6. Prompt construction rule

Every generation prompt should contain these fields in this order:

```text
ASSET AND PURPOSE
SUBJECT
ACTION
ENVIRONMENT
CAMERA AND LENS CHARACTER
COMPOSITION AND SAFE AREA
LIGHT AND COLOR
MATERIAL AND TEXTURE
MOTION BEHAVIOR (video only)
CONTINUITY REFERENCES
EXCLUSIONS
OUTPUT
```

Describe what should happen positively first. Put exclusions last. Do not add exclusions that contradict an attached Ingredient or frame.

## 7. Approval batch — style anchors

Generate one output per prompt, 16:9. Use the current image model intended for professional-grade control. Do not generate video yet.

### SA-01 — Threshold

```text
ASSET AND PURPOSE
Style anchor for the visual world of [RESTAURANT_NAME]. This may later become the hero
opening frame of a premium restaurant website.

SUBJECT
A closed architectural restaurant threshold at [DESIRED_TIME_OF_DAY], viewed from just
outside. One narrow opening reveals a precisely set table inside. No people.

ENVIRONMENT
[PRIMARY_MATERIALS]. The space feels real, buildable, contemporary, intimate, and
specific to [CITY_COUNTRY], never a generic luxury hotel.

CAMERA AND LENS CHARACTER
Eye-level 35 mm lens character, restrained perspective, exact verticals, camera centered
slightly off-axis as if about to enter.

COMPOSITION AND SAFE AREA
Strong depth corridor. Preserve the central 55 percent for a future portrait crop.
Leave quiet dark negative space in the upper-left and lower-right for interface copy.

LIGHT AND COLOR
Warm directional interior light against deep mineral exterior shadow. Oxblood, smoked
glass, aged metal, charred wood. Rich blacks retain detail; highlights roll off softly.

MATERIAL AND TEXTURE
Photoreal tactile surfaces, small imperfections, restrained 35 mm grain, no glossy CGI.

EXCLUSIONS
No text, logo, menu, signage, guests, fantasy architecture, neon, bloom, lens flare,
symmetrical hotel-lobby styling, or orange-and-teal grade.

OUTPUT
16:9 cinematic still, one image.
```

### SA-02 — Dining room as still life

```text
ASSET AND PURPOSE
Style anchor for [RESTAURANT_NAME], defining the dining-room material, light, and spatial
rhythm for all later website media.

SUBJECT
A long, low dining room before service, with five precisely spaced tables and one table
in the foreground prepared for a guest. No people.

ENVIRONMENT
Contemporary [CUISINE] restaurant in [CITY_COUNTRY], using [PRIMARY_MATERIALS]. The
architecture is quiet and memorable rather than decorative.

CAMERA AND LENS CHARACTER
40 mm editorial architectural photography, shoulder height, controlled one-point depth,
realistic dimensions and straight structural lines.

COMPOSITION AND SAFE AREA
Asymmetric foreground table, deep aisle, protected negative space across the upper
third. Keep the primary table inside the central mobile-safe region.

LIGHT AND COLOR
After-hours ritual palette from the project instruction. Practical fixtures motivate
every highlight. No unexplained colored light.

MATERIAL AND TEXTURE
Real linen, brushed metal, smoked glass, charred timber, stone, subtle grain.

EXCLUSIONS
No text, people, flowers unless they are part of the real brand, fake luxury props,
floating cutlery, duplicated chairs, impossible reflections, neon, excessive haze.

OUTPUT
16:9 cinematic still, one image.
```

### SA-03 — Signature dish as landscape

```text
ASSET AND PURPOSE
Style anchor for signature-dish photography for [RESTAURANT_NAME].

SUBJECT
[SIGNATURE_DISH_01], represented faithfully using @Dish01 if supplied. Preserve the real
ingredients, portion, plate, garnish count, and culinary technique.

ENVIRONMENT
The dish sits on the restaurant's real dark table surface with @Tableware if supplied.
Only one supporting glass or folded linen may appear, and only if composition requires it.

CAMERA AND LENS CHARACTER
Editorial food photography, approximately 50 mm lens character, three-quarter angle,
focus deep enough that the entire intended dish remains legible.

COMPOSITION AND SAFE AREA
Dish offset from center with deliberate negative space. Plate remains fully inside frame.

LIGHT AND COLOR
One large soft directional source, gentle controlled speculars, accurate food color,
deep background, warm highlights, no commercial food-advertising gloss.

MATERIAL AND TEXTURE
Realistic moisture, crust, sauce viscosity, ceramic texture, restrained film grain.

EXCLUSIONS
No invented ingredients, extra garnish, fake steam, melting geometry, duplicated food,
cutlery through the plate, text, branding, hands, or surreal presentation.

OUTPUT
16:9 cinematic still, one image.
```

### SA-04 — Human process

```text
ASSET AND PURPOSE
Style anchor for the human craft sequence of [RESTAURANT_NAME].

SUBJECT
The real @Chef if supplied, otherwise an anonymous chef shown from behind, completing
one exact plating gesture at the pass. The food is [SIGNATURE_DISH_01].

ACTION
One hand steadies the plate while the other places a final small element. Natural working
posture, concentration, no performance for camera.

ENVIRONMENT
Realistic open kitchen/pass consistent with @InteriorAnchor and the approved materials.

CAMERA AND LENS CHARACTER
Documentary editorial image, 50 mm lens character, close but observational.

COMPOSITION AND SAFE AREA
Hands and plate occupy the lower central region. Upper-left negative space remains quiet.

LIGHT AND COLOR
Warm task light, deep surrounding shadows, preserved skin and food color, restrained grain.

EXCLUSIONS
No direct smile, generic white studio kitchen, distorted hands, extra fingers, duplicated
tools, explosive flame, text, logo, floating garnish, or celebrity likeness.

OUTPUT
16:9 cinematic still, one image. Mark as synthetic placeholder if no real chef is used.
```

### Style approval checklist

Approve one anchor family only if:

- it could plausibly be one real restaurant;
- food remains edible and faithful;
- materials and geometry are physically coherent;
- there is useful interface negative space;
- the palette supports readable light and dark typography;
- it avoids generic “luxury restaurant” clichés;
- portrait cropping remains feasible;
- no generated text or brand marks appear.

Save the winner as `@WorldAnchor` and the selected interior as `@InteriorAnchor`.

## 8. Hero sequence prompts

The preferred hero uses first-and-last Frames if supported. Generate a wide version and a separately composed portrait version. Do not simply crop the wide video.

### HR-W-01 — Hero opening frame

Use SA-01 as an Ingredient or edit source.

```text
Create the final opening frame for the website hero. Preserve @WorldAnchor and
@InteriorAnchor exactly. The camera is outside the restaurant threshold at eye level.
The entrance is almost closed, with a narrow view toward one prepared table. Keep the
central 55 percent compositionally safe for a 9:16 adaptation and leave controlled dark
negative space for interface copy. Photoreal, tactile, physically coherent, no people,
no typography, no logo, no signage, no new materials. 16:9.
```

### HR-W-02 — Hero closing frame

Use HR-W-01 and `@InteriorAnchor` as references.

```text
Create the final closing frame for the website hero. It is the exact same restaurant,
threshold, material palette, tableware, time of day, light direction, and color grade as
the opening frame. The camera has moved through the threshold and now rests inside,
facing one prepared table. The table is inviting but empty. Maintain plausible spatial
continuity from the opening frame. Preserve dark negative space above the table for
interface typography. No people, text, logos, menu, floating objects, or changed geometry.
16:9.
```

### HR-W-03 — Wide hero motion

Input mode: first-and-last Frames when supported. Start = HR-W-01; end = HR-W-02.

```text
ASSET AND PURPOSE
Primary scroll-scrub hero clip for [RESTAURANT_NAME].

ACTION AND CAMERA
One unbroken, extremely controlled forward dolly through the restaurant threshold from
the supplied opening frame to the supplied closing frame. The move is slow, linear, and
physically plausible, as if on a short precision track. The threshold opens only as much
as required for the camera. End on a stable prepared table.

MOTION BEHAVIOR
No cuts, transitions, speed ramps, time lapse, orbit, handheld motion, focus pulsing, or
object animation. Keep the architecture, furniture, reflections, table setting, light,
and object count stable. First and final moments settle cleanly for scroll holding.

CONTINUITY
Honor both supplied frames exactly. Do not redesign or restage the room between them.

EXCLUSIONS
No people entering frame, no flicker, geometry warping, breathing walls, moving cutlery,
changing chair count, added signage, typography, logo, particles, or impossible reflections.

OUTPUT
16:9, 8 seconds initially, one clip per generation. Generate two motion variants only.
```

### HR-P-01 — Portrait hero frame

Use the wide opening and closing frames plus `@InteriorAnchor` as Ingredients.

```text
Create a portrait-native opening frame for the same hero sequence. Recompose rather than
crop. Preserve the exact restaurant, threshold, material palette, tableware, light, and
grade. Place the threshold and final table inside the central vertical axis with negative
space above and below for mobile interface copy. No new objects, people, text, logo, or
signage. 9:16.
```

Create a matching portrait closing frame with the same instruction, then generate:

```text
One unbroken precision dolly from the supplied portrait opening frame to the supplied
portrait closing frame. Preserve all architecture, furniture, tableware, lighting, and
object count. Slow linear motion, stable horizon, no cuts, orbit, handheld shake, focus
pulse, flicker, morphing, people, text, or logos. End on a calm stable frame. 9:16,
8 seconds initially, two variants only.
```

### Hero acceptance criteria

- continuous camera path with no visible cut;
- stable walls, doors, furniture, glassware and table setting;
- no light flicker or exposure pumping;
- start and end correspond closely to their supplied frames;
- the important subject survives desktop and mobile compositions;
- sufficient first/last-frame stability for scroll holds;
- no embedded text or identity;
- reduced-motion posters work as complete static compositions.

## 9. Signature dish stills

Repeat this template for 5–8 real dishes. Use real dish Ingredients whenever possible.

```text
ASSET AND PURPOSE
Website editorial still for [DISH_NAME], used in the signature-dish sequence.

SUBJECT
[DISH_DESCRIPTION]. Use @[DISH_INGREDIENT_NAME] as the authoritative identity reference.
Preserve real ingredients, plate, portion, garnish count, technique, and color.

ENVIRONMENT
Same restaurant and @WorldAnchor campaign. Use @Tableware if provided. One dark tactile
surface; no unrelated props.

CAMERA AND COMPOSITION
[4:5 three-quarter portrait / 3:2 overhead / 16:9 low landscape]. Deliberate asymmetry,
plate fully legible, one protected negative-space region for interface metadata.

LIGHT AND MATERIAL
Same motivated directional light, palette, contrast, highlight rolloff, and grain as
@WorldAnchor. Edible realism, accurate texture, enough depth of field to understand the dish.

EXCLUSIONS
No invented ingredients, extra garnish, fake steam, dripping effects, floating food,
rubbery surfaces, malformed plate, duplicated utensils, hands, text, logo, or branding.

OUTPUT
One image. Generate two variants only: one 4:5 and one alternate composition specified above.
```

## 10. Interior set

### IN-01 — Dining room wide

```text
Create a 16:9 architectural editorial image of the approved @InteriorAnchor dining room
before service. Preserve the exact room, materials, furniture family, tableware, light
direction, and grade. Show a deeper viewpoint than the hero closing frame, with clear
spatial rhythm and a quiet region for copy. Straight structural lines, realistic chair
spacing, no guests, no text, no new decorative objects, no duplicated furniture, no
fantasy architecture. One image.
```

### IN-02 — Exterior arrival

```text
Create a 3:2 exterior arrival image for the same restaurant at [DESIRED_TIME_OF_DAY].
The entrance, materials, and light seen through the threshold must match @WorldAnchor.
Specific [CITY_COUNTRY] street character without famous landmarks or readable business
signs. One restrained human silhouette may pass at a distance, without identifiable face.
Leave negative space around the entrance. No text, logo, fake signage, parked luxury car,
crowd, rain cliché, neon, or cinematic lens flare. One image.
```

### IN-03 — Table detail

```text
Create a 4:5 editorial detail of one prepared table in @InteriorAnchor. Preserve the real
@Tableware references. Show tactile linen, glass, cutlery, ceramic, and one restrained
material detail associated with [CUISINE]. Warm directional light, realistic reflections,
shallow but sufficient focus, quiet background. No food, flowers unless brand-authentic,
text, menu, logo, duplicated utensils, floating glassware, or generic wedding styling.
One image.
```

### IN-04 — Material macro

```text
Create a 3:2 close editorial study of [PRIMARY_MATERIALS] inside the same restaurant:
one junction where stone, aged metal, smoked glass, and charred wood meet. Architectural
truth, realistic wear, motivated grazing light, restrained grain, strong abstract rhythm
without becoming CGI. No people, text, logo, neon, impossible joints, liquid metal,
or decorative product styling. One image.
```

## 11. Chef and process assets

### CP-01 — Real chef portrait

Use only with an approved real-chef Ingredient.

```text
Create a 3:4 environmental portrait of @Chef inside @InteriorAnchor or the corresponding
kitchen. Preserve the person’s identity, age, facial structure, skin tone, hair, and
approved clothing. Three-quarter profile, calm concentration, not looking at camera.
Editorial naturalism, 50 mm lens character, motivated task light, hands relaxed and
anatomically correct. Leave negative space on [LEFT/RIGHT]. No beautification, celebrity
transformation, smile-for-camera, altered uniform branding, text, logo, extra fingers,
or generic stock portrait styling. One image.
```

If no authorized chef reference exists, generate an anonymous over-shoulder placeholder and label it `SYNTHETIC_PLACEHOLDER_REPLACE_WITH_REAL_CHEF`.

### CP-02 — Plating process clip

Use `@Chef`, `@Dish01`, `@Tableware`, and `@InteriorAnchor` where available.

```text
ASSET AND PURPOSE
Secondary process clip for a pinned or mask-reveal website section.

SUBJECT AND ACTION
The approved chef, or anonymous hands if no chef reference is supplied, completes one
precise plating gesture on [SIGNATURE_DISH_01]. One hand steadies the plate; the other
places one final real element. The action happens once, at natural speed.

CAMERA
Locked close three-quarter view with an almost imperceptible 5 cm lateral slide. No orbit,
push-in, rack focus, handheld shake, or dramatic slow motion.

CONTINUITY
Preserve dish, plate, garnish count, hands, tools, pass, wardrobe, lighting, and grade.

EXCLUSIONS
No extra fingers, changing hand identity, moving plate geometry, duplicated tweezers,
floating garnish, explosive flame, excessive steam, food morphing, text, or logo.

OUTPUT
16:9, 6 or 8 seconds depending on active model support, two variants only.
```

### CP-03 — Service ritual clip

```text
One continuous locked-off cinematic observation of a server’s anonymous hands placing a
single prepared plate onto a table in @InteriorAnchor. The plate, tableware, linen, room,
lighting, and color grade remain stable. Natural pace, one action, then a clean one-second
hold. No visible guest face, no camera move, no repeated action, no object duplication,
no warped hands, no changing dish, no text, logo, or branding. 16:9, 6 or 8 seconds,
two variants only.
```

## 12. Reservation CTA assets

### RS-01 — Invitation wide

```text
Create a 16:9 final-call-to-action image for [RESTAURANT_NAME]. Show one empty table prepared
for two inside @InteriorAnchor, viewed from the restaurant threshold after service setup.
The composition communicates anticipation rather than absence. Preserve the approved
material, tableware, lighting, palette, and grade. Leave a broad quiet dark region on
[LEFT/RIGHT] for reservation copy and button. No people, food, menu, text, logo, flowers
unless brand-authentic, champagne cliché, engagement styling, or hotel-lobby gloss.
One image.
```

### RS-02 — Invitation portrait

```text
Create a portrait-native 4:5 variation of the approved reservation scene. Recompose the
same table and room rather than cropping. Keep the table in the lower half and preserve
quiet negative space above for interface copy. Exact continuity of materials, tableware,
light, palette, and grade. No new props, people, food, text, or branding. One image.
```

## 13. Controlled refinement prompts

Change one variable per refinement. Do not rewrite the whole prompt after a near-success.

### Preserve everything; fix composition

```text
Preserve the restaurant, subject, materials, object count, lighting, palette, grade, and
camera height exactly. Change only the composition: move [SUBJECT] approximately [AMOUNT]
toward [DIRECTION] and create cleaner negative space in [REGION]. Do not introduce,
remove, restyle, or relight anything else.
```

### Preserve everything; fix camera motion

```text
Preserve every visual detail and the supplied start/end frames. Change only the camera
motion: use a slower, perfectly linear [DOLLY/TRACK] with stable horizon and no easing
pulse, orbit, shake, focus change, or spatial warping. Keep first and final moments calm.
```

### Remove an artifact

```text
Preserve all accepted content and composition. Remove only [ARTIFACT]. Reconstruct the
occluded background using the same real material, light, perspective, and texture. Do not
change nearby objects, framing, color grade, subject identity, or object count.
```

### Correct food fidelity

```text
Use @[DISH_INGREDIENT_NAME] as authoritative. Preserve the accepted composition and light.
Correct only the dish so ingredients, portion, plate, garnish count, sauce placement,
texture, and color match the reference. Do not beautify, add steam, add garnish, or alter
the table setting.
```

### Adapt wide to portrait without a crop

```text
Recompose the accepted scene natively for 9:16. Preserve the exact restaurant, subject,
materials, object count, lighting, palette, grade, and moment. Move the visual hierarchy
onto the central vertical axis and create protected negative space for mobile interface
copy. Do not crop faces, dishes, plates, doors, or key architecture. Do not add content.
```

## 14. Scene assembly

Use Scenebuilder only for previewing continuity and editorial rhythm. The website will use individual clips with GSAP/ScrollTrigger, not one baked promotional film.

Suggested preview order:

1. `HR-W-03` threshold dolly;
2. `CP-02` plating gesture;
3. `CP-03` service ritual.

Trim unstable beginnings and endings, but do not hide major generation defects with rapid cuts. Download each accepted clip individually as well as any Scenebuilder preview.

## 15. Download and naming

Download the highest resolution Flow offers for the selected model. Preserve original downloads; web compression happens later.

Naming convention:

```text
[restaurant]_[asset-id]_[wide|portrait]_[model]_[version]_[status].[ext]
```

Examples:

```text
restaurant_hr-w-03_wide_veo31_v03_approved.mp4
restaurant_sa-02_wide_nanobanana_v02_approved.png
restaurant_cp-02_wide_omniflash_v04_rejected-hands.mp4
```

Never overwrite an accepted version. Save useful source frames to the project so they can become Ingredients or start/end Frames for later clips.

## 16. Acceptance review

### Images

- subject, dish, room and tableware match approved references;
- hands, faces, plates, utensils and furniture are structurally correct;
- no text artifacts or accidental branding;
- negative space supports the intended website placement;
- crop works at the requested aspect ratio;
- grade matches `@WorldAnchor`;
- food remains appetizing and truthful;
- no fake commercial claim is implied.

### Video

- one understandable action and one coherent camera move;
- no cut, spatial morph, flicker, exposure pulse or focus pumping;
- object count and geometry stay stable;
- first and last frames are usable poster/hold states;
- central safe zone works for mobile where required;
- no unwanted audio-dependent meaning;
- clip remains understandable when muted;
- a static poster can replace it for reduced motion.

Reject rather than repair when the core composition, identity, architecture, dish, or camera path is wrong. Use editing only for bounded corrections.

## 17. Provenance log

Record every accepted and materially rejected generation:

```markdown
### [ASSET_ID] — [SHORT_NAME]

- Created:
- Flow project:
- Flow feature: text / ingredients / first frame / first+last / video edit / extend
- Model shown in Flow:
- Orientation:
- Duration:
- Prompt version:
- Ingredient files:
- Start frame:
- End frame:
- Outputs requested:
- Selected output:
- Rejected outputs and reasons:
- Human subjects/reference permission:
- Intended placement:
- Alt-text status: informative / decorative / pending
- Rights/provenance reviewer:
- Approval state: draft / selected / approved / rejected
- Notes:
```

Generated outputs should be treated as generated media, not evidence of the restaurant’s real interior, chef, dishes, clientele, awards, or operations. Replace synthetic placeholders with first-party photography before representing them as factual.

Google states that Flow generations include invisible SynthID provenance and that its Terms of Service govern commercial use. Do not remove or attempt to defeat provenance marks.

## 18. Official sources checked

- [Create videos in Google Flow](https://support.google.com/flow/answer/16353334?hl=en)
- [Google Flow models and supported features](https://support.google.com/flow/answer/16352836?hl=en)
- [Use the Google Flow Agent](https://support.google.com/flow/answer/17093911?hl=en)
- [Edit videos and build scenes](https://support.google.com/flow/answer/16935718?hl=en)
- [Create and edit images](https://support.google.com/flow/answer/16729550?hl=en)
- [Manage Flow projects, assets and collections](https://support.google.com/flow/answer/16935308?hl=en)

Recheck the model/feature table and credit display inside Flow immediately before production because availability, duration, model routing, and costs may change.

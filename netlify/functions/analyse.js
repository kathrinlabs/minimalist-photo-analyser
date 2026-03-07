const Anthropic = require("@anthropic-ai/sdk");

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — based on the complete "Minimalist Photo Composition" course
// by Kathrin Federer
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert photography and visual composition coach specialising in minimalist aesthetics. You analyse images based on the principles taught in the course "The Art of Minimalist Photo Composition" by Kathrin Federer.

Your role is that of a warm, precise, and encouraging personal coach. You evaluate images honestly and constructively, always explaining WHY each observation matters so the user genuinely learns — not just follows instructions.

THE CORE PHILOSOPHY YOU APPLY:
Minimalism is not "empty" or "simple." It is intentional reduction: removing everything that dilutes the message and strengthening everything that supports it. Minimalism always needs at least one source of tension — a contrast (light/dark, colour, size), a mood (light, atmosphere), or a deliberate surprise. An image without tension is not minimalist — it is empty.

THE 6 CORE PRINCIPLES OF MINIMALISM (your decision-making framework):
1. Intention Before Decoration — every shape, colour, and object must have a purpose
2. Hierarchy Before Harmony — it must be clear what leads; not everything should be equally beautiful
3. Contrast Before Variety — impact comes from a few strong contrasts, not many nuances
4. Space Is an Element — negative space/whitespace is not "nothing"; it is active design
5. Repetition Creates Calm — repeating shapes, distances, and structures reduce chaos
6. Reduction Is Iterative — minimalism is rarely the first draft; it is the result of many decisions

THE PROCESS FRAMEWORK YOU REFERENCE:
- Step 1: Define Intent — "This image should convey ___." What is the one main signal?
- Step 2: Condense to 3 Keywords — the compass for all decisions (e.g. "still – vast – golden")
- Step 3: Visual Hierarchy — main focus → 1–2 supporting elements → everything else removed
- Step 4: Asset Budget — Main subject: 1 / Supporting element: max 1 / Accent: max 1 / Colours: max 2–3
- Step 5: Reduction Rounds — each round removes or simplifies; work toward "clearer," not "more"

THE 7 CORE DESIGN PRINCIPLES (evaluate all 7):
1. Focal Point — Is there one element that is seen first? (thumbnail test: shrink to stamp size — still clear?)
2. Contrast — Tonal, colour, size, sharpness, or dynamic contrast. (grayscale test: does the focal point remain clear?)
3. Whitespace / Negative Space — Is it used boldly and intentionally, or does it look unfinished?
4. Alignment — Are edges and objects intentionally aligned to an axis or grid?
5. Proximity — Can you identify 1–3 clear groups without thinking?
6. Balance — Symmetrical (calm) or asymmetrical (exciting but stable) — is it visually stable?
7. Colour — Controlled palette (max 2–3 dominant colours). Accent colour covers max 5–10% of the area.

CONTRAST TOOLBOX (reference as relevant):
- Tonal Contrast: bright subject vs. dark background (or vice versa) — the #1 essential
- Colour Contrast: cool/warm, complementary, saturated/desaturated
- Focus Contrast: sharp subject, calm surroundings
- Size/Quantity Contrast: one large element + lots of space
- Dynamic Contrast: static vs. diagonal, motion blur

COMPOSITION RULES (Top 5 for minimalism — reference by name):
1. Rule of Thirds — subject at intersection point, rest breathes
2. Symmetry — creates calm and precision; strongest with negative space
3. Negative Space / Framing Depth — focus through emptiness
4. Leading Lines — direct the eye without adding elements
5. Centered / Circular — iconic and direct

SIGNAL-TO-NOISE FRAMEWORK:
The signal is the message, the subject, the idea. Noise is everything that distracts, embellishes, or is "nice to have." Your job is to identify both precisely.

MINIMALISM SCORE (out of 35 — 7 criteria × 5 points each):
1. Is the focus clear? /5
2. Is the background calm/supportive? /5
3. Are max 1–2 dominant contrasts applied consistently? /5
4. Is the colour concept controlled? /5
5. Do all elements have a clear function? /5
6. Is there enough space/breathing room? /5
7. Does the overall effect feel professional/stable? /5

Score interpretation:
- 28–35: Very clear — the work is thoughtfully minimalist
- 20–27: Good foundation, but there is still noise — identify the weakest area
- Below 20: Reset the concept and hierarchy — return to intention and workflow

10-SECOND TEST (always apply):
What do you see first? What is the second thing? What is the image about? If the order is not stable, the hierarchy is missing.

COMMON MISTAKES TO WATCH FOR:
- Minimalism = Emptiness (reduction without tension)
- Everything equally important (no clear hierarchy)
- Too many small details creating clutter
- Colour accents used too broadly (should be max 5–10% of area)
- Whitespace without direction (empty space without a focused subject)
- Mixing too many principles without prioritisation`;

// ─────────────────────────────────────────────────────────────────────────────
// USER PROMPT — MODE A: Lightroom / Photo Edit
// ─────────────────────────────────────────────────────────────────────────────

const USER_PROMPT_A = `Please analyse this photo through the lens of minimalist composition, applying the full framework from the course "The Art of Minimalist Photo Composition" by Kathrin Federer. The user wants suggestions for improving this photo using Lightroom or basic editing tools only — no compositing, no new elements added.

Structure your response in these exact sections:

**1. First Impression — The 10-Second Test**
What do you see first? What is the second thing? What is the image about? Is the visual hierarchy immediately clear, or does the eye wander?

**2. Signal vs. Noise**
What is the main signal (the message, the subject, the idea)? What elements create noise (distract, embellish, or are "nice to have")? What should be reduced or removed to let the signal dominate?

**3. Intention & Message**
What does this image appear to want to convey? Write a one-sentence brief for it: "This image should convey ___." Then name 3 keywords that define its mood and style. Do the current composition choices support this intention — or work against it?

**4. Composition Analysis**
Which composition rule is being used (Rule of Thirds, Symmetry, Leading Lines, Centered, Negative Space, etc.)? Is it applied with intention and clarity? How does the visual flow work — where does the eye move, and in what order?

**5. The 7 Design Principles — Evaluation**
Evaluate each principle with a short, specific assessment and a score (1–5). Explain WHY the score reflects what you see:
- Focal Point: [assessment] — Score: /5
- Contrast: [assessment — specify which type: tonal, colour, size, focus, dynamic] — Score: /5
- Whitespace / Negative Space: [assessment — intentional or unfinished?] — Score: /5
- Alignment: [assessment — is there a clear axis or grid?] — Score: /5
- Proximity: [assessment — are elements clearly grouped?] — Score: /5
- Balance: [assessment — symmetrical or asymmetrical, and is it stable?] — Score: /5
- Colour: [assessment — how many dominant colours, is the palette controlled?] — Score: /5

**6. Asset Budget Check**
What is currently in this image? List: Main subject / Supporting elements / Accents / Dominant colours. Does the asset budget feel controlled (max 1 main + 1 support + 1 accent + max 2–3 colours)? What could be removed or simplified?

**7. Lightroom Edit Suggestions**
Give 3–5 specific, actionable suggestions for improving this photo using tonal, colour, or crop adjustments. For EACH suggestion, explain WHY it improves the minimalist quality of the image — connect it to a specific principle (e.g. "This increases tonal contrast, which strengthens the focal point and passes the grayscale test").

**8. Minimalism Score**
Score each criterion /5 and give the total /35:
1. Focus clear: /5
2. Background calm/supportive: /5
3. Max 1–2 dominant contrasts applied consistently: /5
4. Colour concept controlled: /5
5. All elements have a clear function: /5
6. Enough space/breathing room: /5
7. Overall effect feels professional/stable: /5
**Total: /35** — [one-sentence interpretation based on the score range]

**9. One Key Insight**
One sentence that captures the single most important thing this photo needs to become more minimalist.`;

// ─────────────────────────────────────────────────────────────────────────────
// USER PROMPT — MODE B: Photoshop Composite
// ─────────────────────────────────────────────────────────────────────────────

const USER_PROMPT_B = `Please analyse this photo through the lens of minimalist composition, applying the full framework from the course "The Art of Minimalist Photo Composition" by Kathrin Federer. The user wants creative suggestions for developing this into a minimalist digital composite in Photoshop — adding new elements, backgrounds, atmosphere, and creative staging.

Structure your response in these exact sections:

**1. First Impression — The 10-Second Test**
What do you see first? What is the potential signal? What is noise? Is there a clear focal point, or does the eye wander? What is the creative opportunity in this image?

**2. Signal vs. Noise — Current State**
What is the strongest element worth keeping or building on? What creates noise and should be removed, masked, or replaced in the composite? What is the one main subject that could carry the entire composition?

**3. Intention & Concept Brief**
Write a one-sentence brief for the composite: "This image should convey ___." Name 3 keywords that define the mood and style (e.g. "still – vast – golden"). What emotion or idea should the finished composite communicate?

**4. Current Composition Analysis**
Which composition principles are present in the original? What is working? What is limiting the image? How does the visual flow currently work — and how could it be improved in the composite?

**5. The 7 Design Principles — Current State & Composite Potential**
Brief evaluation of each (focus on creative potential, not just current state):
- Focal Point: [current state + composite opportunity]
- Contrast: [current state + which contrast type to develop]
- Whitespace / Negative Space: [current state + how to use it in the composite]
- Alignment: [current state + composition rule to apply]
- Proximity: [current state + how to group elements in the composite]
- Balance: [current state + symmetrical or asymmetrical approach]
- Colour: [current state + colour model for the composite]

**6. Composite Concept Proposal**
Describe a specific minimalist composite idea based on this image:
- **The Concept** (one sentence — the "1-Sentence Brief"): ___
- **3 Mood Keywords**: ___ – ___ – ___
- **The Stage**: What background/environment would work? (e.g. calm lake, wide field, desert, tunnel, solid colour, soft gradient) — and why does it support the concept?
- **Main Subject Placement**: Which composition rule? What size ratio relative to the image (10–20% = maximum negative space / 30–40% = balanced / 50%+ = close-up)? What perspective/viewpoint?
- **Atmosphere**: What atmospheric elements would add depth without adding noise? (fog, light rays, time of day, colour temperature, haze) — keep it to max 1–2
- **Accent**: One optional accent element (moon, bird silhouette, single light source, reflection) — or "none" if the composition is already complete
- **Colour Model**: Choose one — Monochrome / Neutral + Accent / Duotone — and specify which exact palette (e.g. "warm beige + deep shadow, accent: burnt orange")

**7. Asset Budget for this Composite**
Define the asset budget strictly:
- Main subject: [description]
- Supporting element: [description or "none"]
- Accent: [description or "none"]
- Dominant colours: max 2–3 (list them)
- Atmospheric effects: max 1–2 (describe)
- Rule: If you want to add something, something else must be removed.

**8. What to Remove or Simplify**
Which existing elements in the photo should be removed, masked, or replaced in the composite to achieve minimalist clarity? Be specific about what creates noise and why removing it strengthens the signal.

**9. Step-by-Step Starting Point**
Give the first 3–4 concrete steps the user should take in Photoshop to begin this composite. Reference the 9-step workflow from the course where relevant (Stage → Subject → Atmosphere → Mood).

**10. Minimalism Score (Current Photo)**
Score each criterion /5 and give the total /35:
1. Focus clear: /5
2. Background calm/supportive: /5
3. Max 1–2 dominant contrasts applied consistently: /5
4. Colour concept controlled: /5
5. All elements have a clear function: /5
6. Enough space/breathing room: /5
7. Overall effect feels professional/stable: /5
**Total: /35** — [one-sentence interpretation]

**11. One Key Insight**
One sentence: what is the biggest creative opportunity in this image for a minimalist composite?`;

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER — uses streaming to avoid 504 timeout
// ─────────────────────────────────────────────────────────────────────────────

exports.handler = async function (event) {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { mode = "A", image, mediaType = "image/jpeg" } = body;

  if (!image) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "No image provided" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server configuration error: API key not set." }),
    };
  }

  const client = new Anthropic({ apiKey });
  const userPrompt = mode === "A" ? USER_PROMPT_A : USER_PROMPT_B;

  try {
    // Use non-streaming call but with reduced max_tokens for speed
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: image,
              },
            },
            {
              type: "text",
              text: userPrompt,
            },
          ],
        },
      ],
    });

    const analysis = response.content[0].text;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ analysis }),
    };
  } catch (err) {
    console.error("Anthropic API error:", err);
    return {
      statusCode: err.status || 500,
      headers,
      body: JSON.stringify({ error: err.message || "Analysis failed. Please try again." }),
    };
  }
};

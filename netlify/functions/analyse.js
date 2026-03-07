const Anthropic = require("@anthropic-ai/sdk");

// ─────────────────────────────────────────────────────────────────────────────
// PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert photography and visual composition coach specialising in minimalist aesthetics. You analyse images based on the principles taught in the course "The Art of Minimalist Photo Composition" by Kathrin Federer.

Your analysis must always:
1. Evaluate the image honestly and constructively
2. Reference specific course principles by name (e.g. Signal-to-Noise Ratio, Focal Point, Negative Space, Hierarchy, 60/30/10 Colour Rule, Asset Budget, etc.)
3. Explain WHY each suggestion matters — so the user learns, not just follows instructions
4. Be warm, precise, and encouraging — like a personal coach

The 7 core design principles to evaluate are:
- Focal Point (Is there one clear subject that dominates?)
- Contrast (Tonal, colour, size, or sharpness contrast)
- Whitespace / Negative Space (Is it used intentionally?)
- Alignment (Does the composition feel deliberate?)
- Proximity (Are related elements grouped logically?)
- Balance (Symmetrical or asymmetric — but stable)
- Colour (Controlled palette — max 2–3 dominant colours)

Also evaluate:
- Signal-to-Noise Ratio (What is the signal? What is noise?)
- Composition Rule used (Rule of Thirds, Symmetry, Leading Lines, Centered, etc.)
- Visual Hierarchy (What do you see first, second, third?)
- Minimalism Score out of 35 (7 criteria × 5 points each): Focal Point, Background calm, Dominant contrasts, Colour concept, Elements with function, Enough breathing room, Overall professional stability`;

const USER_PROMPT_A = `Please analyse this photo through the lens of minimalist composition. The user wants suggestions for improving this photo using Lightroom or basic editing tools only — no compositing, no new elements added.

Structure your response in these sections:

**1. First Impression (10-Second Test)**
What do you notice first? What is the signal? What is the noise?

**2. Composition Analysis**
Which composition rule is being used (or should be)? Is the visual hierarchy clear?

**3. The 7 Design Principles — Evaluation**
Evaluate each principle with a short assessment and score (1–5):
- Focal Point: [assessment] — Score: /5
- Contrast: [assessment] — Score: /5
- Whitespace/Negative Space: [assessment] — Score: /5
- Alignment: [assessment] — Score: /5
- Proximity: [assessment] — Score: /5
- Balance: [assessment] — Score: /5
- Colour: [assessment] — Score: /5

**4. Signal-to-Noise Analysis**
What is the main signal? What elements create noise? What should be reduced or removed?

**5. Lightroom Edit Suggestions**
Give 3–5 specific, actionable suggestions for improving this photo using tonal, colour, or crop adjustments. For EACH suggestion, explain WHY it improves the minimalist quality of the image.

**6. Minimalism Score**
Score /35 with a one-sentence interpretation.

**7. One Key Insight**
One sentence that captures the most important thing this photo needs.`;

const USER_PROMPT_B = `Please analyse this photo through the lens of minimalist composition. The user wants creative suggestions for developing this into a minimalist digital composite in Photoshop — adding new elements, backgrounds, atmosphere.

Structure your response in these sections:

**1. First Impression (10-Second Test)**
What do you notice first? What is the potential signal? What is noise?

**2. Current Composition Analysis**
Which composition principles are present? What is working? What is limiting the image?

**3. The 7 Design Principles — Current State**
Brief evaluation of each (no scores needed — focus on creative potential):
- Focal Point, Contrast, Whitespace, Alignment, Proximity, Balance, Colour

**4. Composite Concept Proposal**
Describe a specific minimalist composite idea based on this image. Include:
- The concept in one sentence (the "1-Satz-Brief")
- 3 keywords that define the mood (e.g. "still – vast – golden")
- The Stage: What background/environment would work?
- The Main Subject: How should the subject be placed? (composition rule + size ratio)
- Atmosphere: What atmospheric elements would add depth? (fog, light rays, time of day, colour temperature)
- Accent: One optional accent element (moon, bird silhouette, single light source, or nothing)
- Colour Model: Monochrome / Neutral + Accent / Duotone — and which specific palette

**5. What to Remove or Simplify**
Which existing elements in the photo should be removed, masked, or replaced in the composite to achieve minimalist clarity?

**6. Asset Budget for this Composite**
Define the asset budget:
- Main subject: [description]
- Secondary element: [description or "none"]
- Accent: [description or "none"]
- Colours: max 2–3 (list them)
- Effects: [max 1–2, describe]

**7. Step-by-Step Starting Point**
Give the first 3 concrete steps the user should take in Photoshop to begin this composite.

**8. Minimalism Score (Current Photo)**
Score /35 with a one-sentence interpretation.

**9. One Key Insight**
One sentence: what is the biggest creative opportunity in this image?`;

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────

exports.handler = async function (event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // CORS headers
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
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
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
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Analysis failed. Please try again." }),
    };
  }
};

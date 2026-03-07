const Anthropic = require("@anthropic-ai/sdk");

const SYSTEM_PROMPT = `You are an expert minimalist photography coach applying the framework from "The Art of Minimalist Photo Composition" by Kathrin Federer.

CORE PHILOSOPHY: Minimalism = intentional reduction. Keep what strengthens the message, remove what dilutes it. Every composition needs at least one tension (contrast, mood, or surprise).

THE 7 DESIGN PRINCIPLES: Focal Point, Contrast (tonal/colour/size/focus/dynamic), Whitespace, Alignment, Proximity, Balance, Colour (max 2–3 dominant colours, accent max 5–10% of area).

MINIMALISM SCORE (7 criteria × 5 pts = 35 total):
1. Focus clear /5 | 2. Background calm/supportive /5 | 3. Max 1–2 dominant contrasts /5 | 4. Colour controlled /5 | 5. All elements have function /5 | 6. Enough breathing room /5 | 7. Overall effect professional/stable /5
Score: 28–35 = very clear minimalist | 20–27 = good base, still noise | below 20 = reset concept

Be warm, precise, and concise. Every observation must explain WHY it matters.`;

const USER_PROMPT_A = `Analyse this photo using the Minimalist Photo Composition framework. Lightroom/editing only — no compositing.

**1. First Impression (10-Second Test)**
What is seen first? Second? Is the hierarchy clear or does the eye wander?

**2. Signal vs. Noise**
What is the main signal? What is noise? What should be reduced?

**3. Intention & 3 Keywords**
Complete: "This image should convey ___." Name 3 mood keywords. Do the composition choices support this?

**4. Composition Rule**
Which rule is used (Rule of Thirds / Symmetry / Leading Lines / Centered / Negative Space)? Is it applied with intention?

**5. The 7 Design Principles**
Rate each 1–5 with one specific observation:
- Focal Point: [obs] — /5
- Contrast: [type + obs] — /5
- Whitespace: [obs] — /5
- Alignment: [obs] — /5
- Proximity: [obs] — /5
- Balance: [obs] — /5
- Colour: [obs] — /5

**6. Lightroom Suggestions**
3 specific edits (tone/colour/crop). For each: what to do + WHY it improves minimalist quality.

**7. Minimalism Score**
1./5 2./5 3./5 4./5 5./5 6./5 7./5 — **Total: /35** [one-sentence verdict]

**8. One Key Insight**
One sentence: the single most important change this photo needs.`;

const USER_PROMPT_B = `Analyse this photo using the Minimalist Photo Composition framework. The user wants a minimalist Photoshop composite — new elements, background, atmosphere allowed.

**1. First Impression (10-Second Test)**
What is seen first? What is the creative potential? What is noise?

**2. Signal vs. Noise**
What is worth keeping? What should be removed/replaced in the composite?

**3. Concept Brief & 3 Keywords**
Complete: "This image should convey ___." Name 3 mood keywords. What emotion should the composite communicate?

**4. Composition Analysis**
What is working in the original? What limits it? Which composition rule to apply in the composite?

**5. The 7 Design Principles — Composite Potential**
One line each (current state → composite opportunity):
- Focal Point | Contrast | Whitespace | Alignment | Proximity | Balance | Colour

**6. Composite Concept**
- **1-Sentence Brief**: ___
- **3 Keywords**: ___ – ___ – ___
- **Stage**: [background/environment + why]
- **Subject Placement**: [composition rule + size ratio]
- **Atmosphere**: max 1–2 elements (fog/light/haze/time of day)
- **Accent**: [one element or "none"]
- **Colour Model**: Monochrome / Neutral+Accent / Duotone — specify palette

**7. Asset Budget**
Main subject / Supporting element / Accent / Colours (max 3) / Atmosphere (max 2)

**8. What to Remove**
Which elements create noise? Why does removing them strengthen the signal?

**9. First 3 Steps in Photoshop**
Concrete starting steps (Stage → Subject → Atmosphere workflow).

**10. Minimalism Score**
1./5 2./5 3./5 4./5 5./5 6./5 7./5 — **Total: /35** [one-sentence verdict]

**11. One Key Insight**
One sentence: the biggest creative opportunity in this image.`;

exports.handler = async function (event) {
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
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
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

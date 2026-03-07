// Minimalist Photo Analyser — Netlify Function
// Uses Node.js native https module (compatible with all Node versions)

const https = require('https');

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert photography and visual composition coach specialising in minimalist aesthetics. You analyse images based on the principles from "The Art of Minimalist Photo Composition" by Kathrin Federer.

CORE FRAMEWORK you always apply:

1. THE 10-SECOND TEST — What does the viewer notice in the first 10 seconds? Is the signal immediately clear, or does noise compete for attention?

2. SIGNAL vs. NOISE — Signal = the one element that carries the message. Noise = everything that distracts. A strong minimalist image has a signal-to-noise ratio of at least 70:30.

3. INTENTION — Every element must earn its place. Ask: does this element strengthen or weaken the signal?

4. COMPOSITION RULES — Identify which rule applies: Rule of Thirds, Golden Ratio, Central Placement, Leading Lines, Frame within Frame, Negative Space Dominance, or Symmetry.

5. THE 7 DESIGN PRINCIPLES (score each /5):
   - Focal Point: One dominant subject that anchors the eye immediately
   - Contrast: Tonal, colour, size, or sharpness contrast that separates signal from background
   - Whitespace / Negative Space: Intentional empty space that gives the subject room to breathe
   - Alignment: Deliberate placement — nothing feels accidental
   - Proximity: Related elements grouped logically; unrelated elements separated
   - Balance: Stable composition — symmetrical or intentional asymmetry
   - Colour: Controlled palette of max 2–3 dominant colours; 60/30/10 rule applied

6. ASSET BUDGET — Minimalism counts elements. Main subject (1), secondary element (max 1), accent (max 1), colours (max 3), effects (max 2). More = less minimalist.

7. MINIMALISM SCORE /35 — Sum of all 7 principles. Context: 1–14 = needs rethinking; 15–21 = developing; 22–28 = strong minimalist work; 29–35 = exceptional.

Always explain WHY each observation matters — so the user learns the principle, not just the verdict. Be warm, precise, and encouraging — like a personal coach who genuinely wants the photographer to grow.`;

// ─────────────────────────────────────────────────────────────────────────────
// MODE A — LIGHTROOM / PHOTO EDIT
// ─────────────────────────────────────────────────────────────────────────────
const USER_PROMPT_A = `Analyse this photo for minimalist composition quality and provide Lightroom/basic editing suggestions only — no compositing or adding new elements.

Use EXACTLY these section headers (bold, numbered):

**1. First Impression (10-Second Test)**
What does the eye land on first? Is the signal immediately clear? What competes for attention in the first 10 seconds?

**2. Signal vs. Noise Analysis**
Identify the main signal. List the specific noise elements. Estimate the signal-to-noise ratio (e.g. 65:35). Is the intention of the image clear?

**3. Composition Rule**
Which composition rule is at work (Rule of Thirds / Golden Ratio / Central Placement / Leading Lines / Negative Space Dominance / Symmetry / other)? Is it applied with confidence or accidentally?

**4. The 7 Design Principles**
- Focal Point: [specific observation] — Score: [X]/5
- Contrast: [specific observation] — Score: [X]/5
- Whitespace/Negative Space: [specific observation] — Score: [X]/5
- Alignment: [specific observation] — Score: [X]/5
- Proximity: [specific observation] — Score: [X]/5
- Balance: [specific observation] — Score: [X]/5
- Colour: [specific observation] — Score: [X]/5

**5. Asset Budget**
Count the elements: main subject, secondary elements, accent elements, dominant colours, effects. Is the budget lean or overloaded?

**6. Lightroom Edit Suggestions**
Give 4 specific, actionable suggestions. For each: what to adjust, by how much (e.g. "+20 Clarity"), and WHY it improves the minimalist quality.

**7. Minimalism Score**
[X] / 35 — [one sentence interpreting the score in context of the image's potential]

**8. One Key Insight**
One sentence only — the single most important thing this photographer should take away.`;

// ─────────────────────────────────────────────────────────────────────────────
// MODE B — PHOTOSHOP COMPOSITE
// ─────────────────────────────────────────────────────────────────────────────
const USER_PROMPT_B = `Analyse this photo as a starting point for a minimalist Photoshop composite. Develop a concrete creative concept that transforms this image into a strong minimalist composition.

Use EXACTLY these section headers (bold, numbered):

**1. First Impression (10-Second Test)**
What is the potential signal in this image? What currently creates noise that would need to be removed or replaced?

**2. Current Composition Analysis**
What compositional strengths can be kept? What fundamentally limits this image as a minimalist piece?

**3. The 7 Design Principles — Creative Potential**
- Focal Point: [current state → composite potential] — Score: [X]/5
- Contrast: [current state → composite potential] — Score: [X]/5
- Whitespace/Negative Space: [current state → composite potential] — Score: [X]/5
- Alignment: [current state → composite potential] — Score: [X]/5
- Proximity: [current state → composite potential] — Score: [X]/5
- Balance: [current state → composite potential] — Score: [X]/5
- Colour: [current state → composite potential] — Score: [X]/5

**4. Composite Concept**
- Concept (1 sentence — the vision):
- 3 mood keywords:
- Stage/background (describe the new environment):
- Subject placement (which composition rule + position + size ratio):
- Atmosphere (light quality, time of day, weather, mood):
- Accent element (one small detail — or "none"):
- Colour model + palette (name the 2–3 colours with approximate description):

**5. What to Remove or Replace**
List each element to mask out or replace, with a specific reason why it weakens the minimalist concept.

**6. Asset Budget**
- Main subject: [what it is]
- Secondary element: [what it is, or "none"]
- Accent: [what it is, or "none"]
- Dominant colours (max 3): [list them]
- Effects (max 2): [e.g. soft vignette, subtle grain — or "none"]

**7. First 3 Photoshop Steps**
Concrete, actionable steps in the right order to begin building this composite.

**8. Minimalism Score**
[X] / 35 — [one sentence on the composite's potential score once realised]

**9. One Key Insight**
One sentence only — the single creative decision that will make or break this composite.`;

// ─────────────────────────────────────────────────────────────────────────────
// ANTHROPIC API CALL
// ─────────────────────────────────────────────────────────────────────────────
function callAnthropic(apiKey, model, system, userPrompt, imageBase64, mediaType) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      max_tokens: 2048,
      system,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: userPrompt }
        ]
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject({ status: res.statusCode, body: parsed });
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject({ status: 500, body: { error: 'Failed to parse API response' } });
        }
      });
    });

    req.on('error', (e) => reject({ status: 500, body: { error: e.message } }));
    req.setTimeout(9000, () => {
      req.destroy();
      reject({ status: 504, body: { error: 'Request timed out' } });
    });

    req.write(payload);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────
exports.handler = async function (event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { mode = 'A', image, mediaType = 'image/jpeg' } = body;

  if (!image) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'No image provided' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Server configuration error: API key not set.' }) };
  }

  const userPrompt = mode === 'A' ? USER_PROMPT_A : USER_PROMPT_B;

  try {
    const result = await callAnthropic(apiKey, 'claude-haiku-4-5', SYSTEM_PROMPT, userPrompt, image, mediaType);
    const analysis = result.content[0].text;
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ analysis }) };
  } catch (err) {
    console.error('Function error:', err);
    const status = err.status || 500;
    const message = err.body ? JSON.stringify(err.body) : (err.message || 'Analysis failed');
    return { statusCode: status, headers: corsHeaders, body: JSON.stringify({ error: message }) };
  }
};

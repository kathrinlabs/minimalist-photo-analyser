// Minimalist Photo Analyser — Netlify Function
// Node.js native https module — no external dependencies

const https = require('https');

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — full course framework
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a minimalist photography coach trained on the complete framework from "The Art of Minimalist Photo Composition" by Kathrin Federer. You think like a precise, warm coach — not an essay writer.

CORE FRAMEWORK:
- Minimalism = intentional reduction. Remove everything that dilutes the message. Strengthen everything that supports it.
- Every element must pass the Function Test: What purpose does it serve? (focus / context / movement / tension / information / character). If it serves none — it must go.
- Minimalism always needs at least ONE source of tension: contrast (light/dark, size, colour), mood, or a deliberate surprise.
- Signal = the one element carrying the message. Noise = everything distracting from it. Target: 70% signal area, 30% active content.
- The 10-Second Test: What do you see first? What second? What is the image about? If the order is unstable — hierarchy is missing.

COMPOSITION RULES (Top 5 for minimalism):
1. Symmetry — calm, precision, value
2. Rule of Thirds — dynamic placement, natural balance
3. Negative Space / Framing Depth — focus through emptiness
4. Leading Lines — guide the eye WITHOUT adding elements. CRITICAL: Leading lines must lead TO the focal point — not beside it. If lines lead to a position and the subject is offset from that endpoint, this is a composition flaw.
5. Centred / Circular — iconic, direct

CONTRAST TOOLBOX (choose 1 dominant + 1 optional secondary):
A) Tonal contrast: bright vs. dark — the #1 essential. Check in grayscale.
B) Colour contrast: cool/warm, complementary, saturated/desaturated
C) Focus contrast: sharp subject, calm surroundings
D) Size/quantity contrast: one large + lots of space
E) Material/form/texture: smooth/rough, round/angular — only if purposeful
F) Dynamic contrast: static vs. diagonal, motion blur

HIGH KEY / LOW KEY:
- High key = bright, airy, light background → calm, clean, optimistic mood
- Low key = dark background, strong shadows → drama, mystery, weight
- Analyse which key the image uses (or should use) and whether it serves the intention.

7 DESIGN PRINCIPLES (score each /5):
1. Focal Point — one element seen first. Thumbnail test: still clear at stamp size?
2. Contrast — makes things visible and important. Grayscale test.
3. Whitespace/Negative Space — active element, not emptiness. Must look intentional.
4. Alignment — professional, removes randomness. Clear axis or grid.
5. Proximity — elements that belong together are close. Max 1–3 clear groups.
6. Balance — symmetrical (calm) or asymmetrical (exciting but stable).
7. Colour — neutral base + accent, or monochrome. Max 2–3 dominant. 60/30/10 rule. Accent = rare.

ASSET BUDGET:
- Main subject: 1 | Secondary element: max 1 | Accent: max 1 | Colours: max 3 | Effects: max 2
- Rule: to add something, something else must be removed.

MINIMALISM SCORE /35 (7 criteria × 5):
1. Focus clear? /5
2. Background calm/supportive? /5
3. Max 1–2 dominant contrasts applied consistently? /5
4. Colour concept controlled? /5
5. All elements have clear function? /5
6. Enough space/breathing room? /5
7. Overall effect professional/stable? /5
Bands: 29–35 = Exceptional | 22–28 = Strong | 15–21 = Developing | below 15 = Needs Rethinking

REMOVAL PRINCIPLE (critical for Lightroom/Mode A):
In Lightroom, you cannot add elements — but you CAN remove or minimise distracting elements using: Healing Brush, Clone Stamp, Masking, Selective Adjustments, Crop. Always consider removal before suggesting additions.

Be precise about what you actually see in the image. Never invent elements that are not there.`;

// ─────────────────────────────────────────────────────────────────────────────
// MODE A — LIGHTROOM EDIT
// ─────────────────────────────────────────────────────────────────────────────
const USER_PROMPT_A = `Analyse this photo for minimalist composition. Lightroom edits only — no compositing, no adding new elements. You may suggest REMOVING or minimising distracting elements using Lightroom tools (Healing, Masking, Crop, Selective Adjustments).

Use these exact bold headers:

**1. First Impression — The 10-Second Test**
What lands first? What second? Is the signal immediately clear, or does something compete? 2–3 sentences.

**2. Signal vs. Noise**
Signal: [describe the main signal]. Noise: [list each noise element — include elements that could be removed or minimised]. Ratio: approx X:Y. Biggest opportunity: [one sentence].

**3. Composition Rule**
Which rule is used? Is the subject placed correctly according to it? IMPORTANT: If leading lines are present, do they lead precisely to the focal point, or is the subject offset from the endpoint? Be specific. One sentence verdict.

**4. The 7 Design Principles**
- Focal Point: [current state, 1 sentence] — Score: X/5
- Contrast: [tonal + colour + which type dominates, 1 sentence] — Score: X/5
- Whitespace/Negative Space: [is it intentional or passive?, 1 sentence] — Score: X/5
- Alignment: [is there a clear axis?, 1 sentence] — Score: X/5
- Proximity: [grouping of elements, 1 sentence] — Score: X/5
- Balance: [symmetrical or asymmetrical, stable?, 1 sentence] — Score: X/5
- Colour: [palette, dominant colours, accent?, 1 sentence] — Score: X/5

**5. Lightroom Edit Suggestions**
4 suggestions. Prioritise: (a) removing/minimising noise elements, (b) tonal/contrast work, (c) high key or low key direction, (d) colour refinement.
Each on one line: [What — specific tool or adjustment with value] — [Why it strengthens minimalism].

**6. Minimalism Score**
Score each criterion:
- Focus clear: /5
- Background calm: /5
- Dominant contrasts (max 2): /5
- Colour controlled: /5
- All elements functional: /5
- Enough breathing room: /5
- Overall professional/stable: /5
[Total] / 35 — [one sentence verdict].

**7. One Key Insight**
One sentence only — the single most important thing this photographer should understand about this image.`;

// ─────────────────────────────────────────────────────────────────────────────
// MODE B — PHOTOSHOP COMPOSITE (conceptual only — no Photoshop instructions)
// ─────────────────────────────────────────────────────────────────────────────
const USER_PROMPT_B = `Analyse this photo as a starting point for a minimalist Photoshop composite. Your job is CONCEPTUAL — describe what the final image should look, feel, and communicate. Do NOT give Photoshop layer instructions or technical steps. Think like a creative director, not a Photoshop tutor.

Be precise about what you actually see in the image. Do not invent elements that are not there.

Use these exact bold headers:

**1. First Impression — The 10-Second Test**
What is the potential signal? What is the main noise? Is there a composition rule already present — and is it working correctly? IMPORTANT: If leading lines are present, do they lead precisely to the focal point, or is the subject offset from the endpoint? This misalignment is a key creative opportunity. 2–3 sentences.

**2. Current Composition Analysis**
What works well (list with ✓). What limits the minimalist potential (list with •). Be specific and honest — only describe what is actually in the image.

**3. The 7 Design Principles — Creative Potential**
For each: current state → what the composite could achieve.
- Focal Point: [current → potential] — Score: X/5
- Contrast: [current → potential, include high key / low key direction] — Score: X/5
- Whitespace/Negative Space: [current → potential] — Score: X/5
- Alignment: [current → potential] — Score: X/5
- Proximity: [current → potential] — Score: X/5
- Balance: [current → potential, e.g. push toward symmetry?] — Score: X/5
- Colour: [current palette → proposed colour model: monochrome / neutral+accent / two-tone] — Score: X/5

**4. Composite Concept**
- Concept: [one sentence — what story or emotion should the final image convey?]
- 3 mood keywords: [word] — [word] — [word]
- The stage: [describe the background/environment in the final image — what stays, what changes, what is removed]
- Subject placement: [which composition rule, exact position, size relative to frame]
- Atmosphere: [light quality, time of day, high key or low key, mood]
- Accent element: [one optional element that adds tension — or "none"]
- Colour model: [chosen model + 2–3 specific colours with purpose]

**5. What to Remove, Replace, or Simplify**
For each problematic element, choose the right action:
- REMOVE: element disappears entirely (clone stamp, healing, crop out)
- REPLACE: element is swapped for something better (e.g. replace busy sky with clean gradient, replace cluttered background with minimal stage, reposition subject to align with leading lines endpoint)
- SIMPLIFY: element stays but is reduced (desaturate, blur, darken into shadow)

List each element with its action and reason. Always consider whether the background or sky should be replaced to better serve the minimalist concept.

**6. Asset Budget**
- Main subject: [what] | Secondary: [what or "none"] | Accent: [what or "none"] | Colours: [max 3, name them] | Atmosphere effects: [max 2 or "none"]

**7. Minimalism Score**
Score each criterion for the CURRENT photo:
- Focus clear: /5
- Background calm: /5
- Dominant contrasts (max 2): /5
- Colour controlled: /5
- All elements functional: /5
- Enough breathing room: /5
- Overall professional/stable: /5
[Total] / 35 — [one sentence on the gap between current and composite potential].

**8. One Key Insight**
One sentence only — the single most important creative decision for this composite.`;

// ─────────────────────────────────────────────────────────────────────────────
// ANTHROPIC API CALL
// ─────────────────────────────────────────────────────────────────────────────
function callAnthropic(apiKey, userPrompt, imageBase64, mediaType) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1800,
      system: SYSTEM_PROMPT,
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
    // 25s timeout — gives Netlify's 26s limit enough room
    req.setTimeout(25000, () => {
      req.destroy();
      reject({ status: 504, body: { error: 'Request timed out after 25s' } });
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
    const result = await callAnthropic(apiKey, userPrompt, image, mediaType);
    const analysis = result.content[0].text;
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ analysis }) };
  } catch (err) {
    console.error('Function error:', err);
    const status = err.status || 500;
    const message = err.body ? JSON.stringify(err.body) : (err.message || 'Analysis failed');
    return { statusCode: status, headers: corsHeaders, body: JSON.stringify({ error: message }) };
  }
};

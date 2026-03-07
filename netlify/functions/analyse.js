// Minimalist Photo Analyser — Netlify Function
// Node.js native https module — no external dependencies

const https = require('https');

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a minimalist photography coach using the framework from "The Art of Minimalist Photo Composition" by Kathrin Federer. Be warm, precise, and brief — like a coach, not an essay writer.

Framework:
- Signal = the one element carrying the message. Noise = everything distracting from it. Target: 70:30 ratio.
- Composition rules: Rule of Thirds, Central Placement, Leading Lines, Negative Space, Symmetry, Golden Ratio.
- 7 Design Principles (score each /5): Focal Point, Contrast, Whitespace/Negative Space, Alignment, Proximity, Balance, Colour (max 2–3 dominant, 60/30/10 rule).
- Asset Budget: 1 main subject, max 1 secondary, max 1 accent, max 3 colours, max 2 effects.
- Minimalism Score /35: 1–14 = needs rethinking; 15–21 = developing; 22–28 = strong; 29–35 = exceptional.

IMPORTANT: Keep every section to 1–2 sentences maximum. The 7 principles list is the only longer section. Total output must be under 700 words.`;

// ─────────────────────────────────────────────────────────────────────────────
// MODE A — LIGHTROOM EDIT
// ─────────────────────────────────────────────────────────────────────────────
const USER_PROMPT_A = `Analyse this photo for minimalist composition. Lightroom edits only — no compositing.

**1. First Impression (10-Second Test)**
1–2 sentences: what lands first, is the signal clear?

**2. Signal vs. Noise**
Signal: [what]. Noise: [what]. Ratio: approx X:Y.

**3. Composition Rule**
Rule used + one sentence on how confidently it's applied.

**4. The 7 Design Principles**
- Focal Point: [1 sentence] — Score: X/5
- Contrast: [1 sentence] — Score: X/5
- Whitespace/Negative Space: [1 sentence] — Score: X/5
- Alignment: [1 sentence] — Score: X/5
- Proximity: [1 sentence] — Score: X/5
- Balance: [1 sentence] — Score: X/5
- Colour: [1 sentence] — Score: X/5

**5. Lightroom Edit Suggestions**
3 edits. Each on one line: [What + value] — [Why it helps minimalism].

**6. Minimalism Score**
[X] / 35 — [one sentence verdict].

**7. One Key Insight**
One sentence only.`;

// ─────────────────────────────────────────────────────────────────────────────
// MODE B — PHOTOSHOP COMPOSITE
// ─────────────────────────────────────────────────────────────────────────────
const USER_PROMPT_B = `Analyse this photo as a starting point for a minimalist Photoshop composite.

**1. First Impression & Signal Potential**
1–2 sentences: what is worth keeping, what must go.

**2. The 7 Design Principles — Creative Potential**
- Focal Point: [current → potential] — Score: X/5
- Contrast: [current → potential] — Score: X/5
- Whitespace/Negative Space: [current → potential] — Score: X/5
- Alignment: [current → potential] — Score: X/5
- Proximity: [current → potential] — Score: X/5
- Balance: [current → potential] — Score: X/5
- Colour: [current → potential] — Score: X/5

**3. Composite Concept**
- Concept: [1 sentence vision]
- Mood: [3 keywords]
- Stage: [new background, 1 sentence]
- Subject placement: [composition rule + position]
- Atmosphere: [light, time of day, mood — 1 sentence]
- Colour palette: [2–3 colours]

**4. What to Remove**
2 bullet points: element — reason.

**5. Asset Budget**
Main: / Secondary: / Accent: / Colours: / Effects:

**6. First 3 Photoshop Steps**
Three numbered steps, one line each.

**7. Minimalism Score**
[X] / 35 — [one sentence verdict + one sentence key insight].`;

// ─────────────────────────────────────────────────────────────────────────────
// ANTHROPIC API CALL
// ─────────────────────────────────────────────────────────────────────────────
function callAnthropic(apiKey, userPrompt, imageBase64, mediaType) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1100,
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
    req.setTimeout(9000, () => {
      req.destroy();
      reject({ status: 504, body: { error: 'Request timed out after 9s' } });
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

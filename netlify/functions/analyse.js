// Minimalist Photo Analyser — Netlify Function
// Uses Node.js native https module (compatible with all Node versions)

const https = require('https');

const SYSTEM_PROMPT = `You are an expert minimalist photography coach using the framework from "The Art of Minimalist Photo Composition" by Kathrin Federer.
Core: Minimalism = intentional reduction. Keep what strengthens the message, remove what dilutes it. Every composition needs at least one tension.
7 Design Principles: Focal Point, Contrast, Whitespace, Alignment, Proximity, Balance, Colour (max 2-3 dominant, accent max 5-10%).
Minimalism Score: 7 criteria × 5 pts = 35 total. Be warm, precise, concise.`;

const USER_PROMPT_A = `Analyse this photo (Lightroom/editing only — no compositing).

**1. First Impression** What is seen first? Is the hierarchy clear?
**2. Signal vs. Noise** What is the signal? What is noise to reduce?
**3. Intention & Keywords** "This image should convey ___." — 3 mood keywords.
**4. Composition Rule** Which rule (Rule of Thirds/Symmetry/Leading Lines/Negative Space)? Applied with intention?
**5. The 7 Design Principles** Rate each 1-5 with one observation: Focal Point / Contrast / Whitespace / Alignment / Proximity / Balance / Colour
**6. Lightroom Suggestions** 3 specific edits (tone/colour/crop) + why each improves minimalist quality.
**7. Minimalism Score** 1./5 2./5 3./5 4./5 5./5 6./5 7./5 — **Total: /35** + one-sentence verdict.
**8. One Key Insight** The single most important change this photo needs.`;

const USER_PROMPT_B = `Analyse this photo for a minimalist Photoshop composite concept.

**1. First Impression** What is seen first? What is the creative potential?
**2. Signal vs. Noise** What is worth keeping? What to remove/replace?
**3. Concept & Keywords** "This image should convey ___." — 3 mood keywords.
**4. Composition Analysis** What works? What limits it? Which rule to apply in the composite?
**5. The 7 Design Principles** Current state → composite opportunity (one line each): Focal Point / Contrast / Whitespace / Alignment / Proximity / Balance / Colour
**6. Composite Concept** 1-sentence brief / Stage / Subject Placement / Atmosphere (max 2 elements) / Accent / Colour Model (Monochrome/Neutral+Accent/Duotone)
**7. Asset Budget** Main subject / Supporting element / Accent / Colours (max 3) / Atmosphere (max 2)
**8. What to Remove** Which elements create noise and why?
**9. First 3 Photoshop Steps** Stage → Subject → Atmosphere workflow.
**10. Minimalism Score** 1./5 2./5 3./5 4./5 5./5 6./5 7./5 — **Total: /35** + one-sentence verdict.
**11. One Key Insight** The biggest creative opportunity in this image.`;

function callAnthropic(apiKey, model, system, userPrompt, imageBase64, mediaType) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      max_tokens: 1024,
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

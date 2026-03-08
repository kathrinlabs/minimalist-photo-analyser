// Minimalist Photo Analyser — Netlify Function
// Node.js native https module — no external dependencies

const https = require('https');

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert photography and visual composition coach specialising in minimalist aesthetics. You analyse images based on the principles taught in the course "The Art of Minimalist Photo Composition" by Kathrin Federer.

Your analysis must always:
1. Evaluate the image honestly, constructively and specifically — describe what you actually see
2. Reference course principles by name: Signal-to-Noise Ratio, Focal Point, Negative Space, Visual Hierarchy, 60/30/10 Colour Rule, Asset Budget, Reduction Rounds, 10-Second Test, etc.
3. Explain WHY each suggestion matters — the user is learning, not just following instructions
4. Be warm, precise and encouraging — like a skilled personal coach

The 7 core design principles:
1. Focal Point — Is there one clear subject that dominates?
2. Contrast — Tonal, colour, size, or sharpness contrast
3. Whitespace / Negative Space — Empty space as active design element
4. Alignment — Elements placed with deliberate intention
5. Proximity — Related elements grouped logically
6. Balance — Symmetrical (calm) or asymmetric (dynamic) but always stable
7. Colour — Controlled palette, max 2-3 dominant colours, 60/30/10 rule

Minimalism Score (each 1-5, total /35): Focal point clear, Background calm, Contrasts consistent, Colour controlled, Elements have function, Breathing room, Overall stability.`;

// ─────────────────────────────────────────────────────────────────────────────
// MODE A — LIGHTROOM EDIT
// ─────────────────────────────────────────────────────────────────────────────
const USER_PROMPT_A = `Analyse this photo for Lightroom/basic editing improvements — no compositing, no new elements.

Use exactly these section headers:

**1. First Impression — The 10-Second Test**
Describe precisely what you notice first, second, third. What is the signal? What is the noise? Would a viewer understand the image's intent within 10 seconds?

**2. Composition Analysis**
Which composition rule is being used or should be applied? (Rule of Thirds, Symmetry, Leading Lines, Centered, Negative Space, Diagonal, L-Form, etc.) Is visual hierarchy clear?

**3. The 7 Design Principles — Evaluation**
Specific observations for each — not generic statements:
- **Focal Point** — [specific observation] — Score: /5
- **Contrast** — [specific observation] — Score: /5
- **Whitespace / Negative Space** — [specific observation] — Score: /5
- **Alignment** — [specific observation] — Score: /5
- **Proximity** — [specific observation] — Score: /5
- **Balance** — [specific observation] — Score: /5
- **Colour** — [specific observation] — Score: /5

**4. Signal vs. Noise Analysis**
Primary signal? List specific elements creating noise — what competes with or weakens the signal? Be precise.

**5. Lightroom Edit Suggestions**
3-5 specific suggestions (tonal adjustments, colour grading, crop, contrast, clarity). For each: what to do AND why it strengthens minimalist quality. Connect to course principles.

**6. Minimalism Score**
1. Focal point clear: /5
2. Background calm: /5
3. Contrasts consistent: /5
4. Colour controlled: /5
5. Elements have function: /5
6. Breathing room: /5
7. Overall stability: /5
**Total: /35** — one sentence interpretation.

**7. One Key Insight**
The single most important thing this photo needs. One sentence only.`;

// ─────────────────────────────────────────────────────────────────────────────
// MODE B — PHOTOSHOP COMPOSITE
// ─────────────────────────────────────────────────────────────────────────────
const USER_PROMPT_B = `Analyse this photo for a minimalist Photoshop composite concept.

Use exactly these section headers:

**1. First Impression — The 10-Second Test**
What is the potential signal — the creative core? What is currently noise? What is the biggest opportunity?

**2. Current Composition Analysis**
What is working and should be kept? What limits the minimalist potential?

**3. The 7 Design Principles — Creative Potential**
- **Focal Point** — current state and potential
- **Contrast** — what type would strengthen this
- **Whitespace / Negative Space** — how space could be used more powerfully
- **Alignment** — what compositional structure would serve this subject
- **Proximity** — how elements should relate in the composite
- **Balance** — symmetric calm or asymmetric tension?
- **Colour** — what palette direction would elevate this

**4. Composite Concept Proposal**
- **Concept** (1 sentence — the 1-Satz-Brief):
- **3 mood keywords**: e.g. still – vast – golden
- **The Stage**: background/environment (be specific)
- **Subject placement**: composition rule + size ratio in frame
- **Atmosphere**: fog, light direction, time of day, colour temperature
- **Accent element**: one specific element or "none"
- **Colour model + palette**: Monochrome / Neutral+Accent / Duotone + specific colours

**5. What to Remove or Simplify**
Specific elements to remove/mask/replace — name each one and explain why it creates noise.

**6. Asset Budget**
- Main subject:
- Secondary element: [or none]
- Accent: [or none]
- Colours (max 3):
- Atmospheric effects (max 2):
Rule: if you add something, something else must go.

**7. First 3 Steps in Photoshop**
Concrete, actionable — name specific tools, layers, techniques.

**8. Minimalism Score — Current Photo**
1. Focal point clear: /5
2. Background calm: /5
3. Contrasts consistent: /5
4. Colour controlled: /5
5. Elements have function: /5
6. Breathing room: /5
7. Overall stability: /5
**Total: /35** — one sentence interpretation.

**9. One Key Creative Insight**
The single biggest creative opportunity this image holds. One sentence only.`;

// ─────────────────────────────────────────────────────────────────────────────
// ANTHROPIC API CALL — no internal timeout (Netlify handles the limit)
// ─────────────────────────────────────────────────────────────────────────────
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured in Netlify environment variables.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  const { mode, image, mediaType } = body;
  if (!image) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No image provided.' }) };
  }

  const userPrompt = mode === 'A' ? USER_PROMPT_A : USER_PROMPT_B;
  const resolvedMediaType = mediaType || 'image/jpeg';

  const requestBody = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: resolvedMediaType,
              data: image
            }
          },
          { type: 'text', text: userPrompt }
        ]
      }
    ]
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            resolve({
              statusCode: res.statusCode,
              body: JSON.stringify({ error: parsed.error?.message || 'Anthropic API error' })
            });
            return;
          }
          const analysis = parsed.content?.[0]?.text || '';
          resolve({
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis })
          });
        } catch (e) {
          resolve({
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to parse API response.' })
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: e.message || 'Network error connecting to Anthropic.' })
      });
    });

    req.write(requestBody);
    req.end();
  });
};

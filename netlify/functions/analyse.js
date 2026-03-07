const https = require('https');

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

const SYSTEM_PROMPT = "You are an expert photography and visual composition coach specialising in minimalist aesthetics. You analyse images based on the principles taught in the course \"The Art of Minimalist Photo Composition\" by Kathrin Federer.\n\nYour analysis must always:\n1. Evaluate the image honestly, constructively and specifically — describe what you actually see\n2. Reference course principles by name: Signal-to-Noise Ratio, Focal Point, Negative Space, Visual Hierarchy, 60/30/10 Colour Rule, Asset Budget, Reduction Rounds, 10-Second Test, etc.\n3. Explain WHY each suggestion matters — the user is learning, not just following instructions\n4. Be warm, precise and encouraging — like a skilled personal coach\n\nThe 7 core design principles:\n1. Focal Point — Is there one clear subject that dominates?\n2. Contrast — Tonal, colour, size, or sharpness contrast\n3. Whitespace / Negative Space — Empty space as active design element\n4. Alignment — Elements placed with deliberate intention\n5. Proximity — Related elements grouped logically\n6. Balance — Symmetrical (calm) or asymmetric (dynamic) but always stable\n7. Colour — Controlled palette, max 2-3 dominant colours, 60/30/10 rule\n\nMinimalism Score (each 1-5, total /35): Focal point clear, Background calm, Contrasts consistent, Colour controlled, Elements have function, Breathing room, Overall stability.";

const USER_PROMPT_A = "Analyse this photo for Lightroom/basic editing improvements — no compositing, no new elements.\n\nUse exactly these section headers:\n\n**1. First Impression — The 10-Second Test**\nDescribe precisely what you notice first, second, third. What is the signal? What is the noise? Would a viewer understand the image's intent within 10 seconds?\n\n**2. Composition Analysis**\nWhich composition rule is being used or should be applied? (Rule of Thirds, Symmetry, Leading Lines, Centered, Negative Space, Diagonal, L-Form, etc.) Is visual hierarchy clear?\n\n**3. The 7 Design Principles — Evaluation**\nSpecific observations for each — not generic statements:\n- **Focal Point** — [specific observation] — Score: /5\n- **Contrast** — [specific observation] — Score: /5\n- **Whitespace / Negative Space** — [specific observation] — Score: /5\n- **Alignment** — [specific observation] — Score: /5\n- **Proximity** — [specific observation] — Score: /5\n- **Balance** — [specific observation] — Score: /5\n- **Colour** — [specific observation] — Score: /5\n\n**4. Signal vs. Noise Analysis**\nPrimary signal? List specific elements creating noise — what competes with or weakens the signal? Be precise.\n\n**5. Lightroom Edit Suggestions**\n3-5 specific suggestions (tonal adjustments, colour grading, crop, contrast, clarity). For each: what to do AND why it strengthens minimalist quality. Connect to course principles.\n\n**6. Minimalism Score**\n1. Focal point clear: /5\n2. Background calm: /5\n3. Contrasts consistent: /5\n4. Colour controlled: /5\n5. Elements have function: /5\n6. Breathing room: /5\n7. Overall stability: /5\n**Total: /35** — one sentence interpretation.\n\n**7. One Key Insight**\nThe single most important thing this photo needs. One sentence only.";

const USER_PROMPT_B = "Analyse this photo for a minimalist Photoshop composite concept.\n\nUse exactly these section headers:\n\n**1. First Impression — The 10-Second Test**\nWhat is the potential signal — the creative core? What is currently noise? What is the biggest opportunity?\n\n**2. Current Composition Analysis**\nWhat is working and should be kept? What limits the minimalist potential?\n\n**3. The 7 Design Principles — Creative Potential**\n- **Focal Point** — current state and potential\n- **Contrast** — what type would strengthen this\n- **Whitespace / Negative Space** — how space could be used more powerfully\n- **Alignment** — what compositional structure would serve this subject\n- **Proximity** — how elements should relate in the composite\n- **Balance** — symmetric calm or asymmetric tension?\n- **Colour** — what palette direction would elevate this\n\n**4. Composite Concept Proposal**\n- **Concept** (1 sentence — the 1-Satz-Brief):\n- **3 mood keywords**: e.g. still – vast – golden\n- **The Stage**: background/environment (be specific)\n- **Subject placement**: composition rule + size ratio in frame\n- **Atmosphere**: fog, light direction, time of day, colour temperature\n- **Accent element**: one specific element or \"none\"\n- **Colour model + palette**: Monochrome / Neutral+Accent / Duotone + specific colours\n\n**5. What to Remove or Simplify**\nSpecific elements to remove/mask/replace — name each one and explain why it creates noise.\n\n**6. Asset Budget**\n- Main subject:\n- Secondary element: [or none]\n- Accent: [or none]\n- Colours (max 3):\n- Atmospheric effects (max 2):\nRule: if you add something, something else must go.\n\n**7. First 3 Steps in Photoshop**\nConcrete, actionable — name specific tools, layers, techniques.\n\n**8. Minimalism Score — Current Photo**\n1. Focal point clear: /5\n2. Background calm: /5\n3. Contrasts consistent: /5\n4. Colour controlled: /5\n5. Elements have function: /5\n6. Breathing room: /5\n7. Overall stability: /5\n**Total: /35** — one sentence interpretation.\n\n**9. One Key Creative Insight**\nThe single biggest creative opportunity this image holds. One sentence only.";

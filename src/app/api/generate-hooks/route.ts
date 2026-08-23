import { NextRequest, NextResponse } from 'next/server';
import { formatMarkdownToLinkedInBold } from '@/lib/unicode-bold';

export async function POST(req: NextRequest) {
  try {
    const {
      topic = 'Tech & Architecture Breakdown',
      slides = [],
      authorName = 'Kamal Sharma',
      customContext = '',
      clientApiKey = '',
    } = await req.json();

    const activeApiKey = (clientApiKey && clientApiKey.trim()) || process.env.GEMINI_API_KEY || '';

    if (!activeApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API key is required. Please set GEMINI_API_KEY in your environment or enter it in the modal.',
        },
        { status: 400 }
      );
    }

    const slideCount = Array.isArray(slides) ? slides.length : 5;

    const systemPrompt = `You are an elite LinkedIn copywriter and viral growth strategist for tech creator ${authorName}.

Topic / Carousel: ${topic}
Slide Count: ${slideCount}
${customContext ? `Additional Context: ${customContext}` : ''}

Generate 5 DISTINCT, HIGH-ENGAGEMENT OPENING HOOKS for a LinkedIn post based on the topic and scanned slide concepts. Each hook must be 2-3 lines max, stopping the scroll instantly.

Generate these 5 angles:
1. "contrarian": The Contrarian / Hard Truth (challenges a common industry misconception or wasted effort)
2. "story": Personal Vulnerability / Failure-to-Success (starts with a relatable early engineering struggle)
3. "framework": The Ultimate Cheat Sheet / Core Patterns (positions the carousel as the only mental model they need)
4. "career": Senior vs. Junior Mindset / Staff Engineer (highlights architectural judgment over brute-force memorization)
5. "actionable": The Direct Problem Solver / Speed Hack (clear, direct promise of what they learn in 2 minutes)

FORMAT RULES:
- Use markdown **bold** where text should be emphasized.
- Return ONLY a valid JSON object matching this schema with NO markdown code block wrappers:
{
  "hooks": [
    {
      "id": "contrarian",
      "tag": "🔥 The Contrarian Truth",
      "hook": "**Line 1.**\\n\\n**Line 2.**\\n\\nShort transition sentence.",
      "whyItWorks": "Triggers curiosity by calling out common industry misconceptions."
    },
    {
      "id": "story",
      "tag": "📖 Personal Story / Vulnerability",
      "hook": "**Line 1.**\\n\\n**Line 2.**\\n\\nShort transition sentence.",
      "whyItWorks": "Builds high empathy and human connection."
    },
    {
      "id": "framework",
      "tag": "⚡ Core Pattern Cheat Sheet",
      "hook": "**Line 1.**\\n\\n**Line 2.**\\n\\nShort transition sentence.",
      "whyItWorks": "High save-rate promise that saves engineers dozens of hours."
    },
    {
      "id": "career",
      "tag": "💼 Senior / Staff Engineer Mindset",
      "hook": "**Line 1.**\\n\\n**Line 2.**\\n\\nShort transition sentence.",
      "whyItWorks": "Appeals to engineers aiming for senior/FAANG promotions."
    },
    {
      "id": "actionable",
      "tag": "🎯 Direct Action & Speed",
      "hook": "**Line 1.**\\n\\n**Line 2.**\\n\\nShort transition sentence.",
      "whyItWorks": "Direct and immediately delivers value without fluff."
    }
  ]
}`;

    // Construct parts array
    const parts: any[] = [{ text: systemPrompt }];

    // Attach all slide images if present for multimodal analysis
    if (Array.isArray(slides) && slides.length > 0) {
      for (const slide of slides) {
        if (slide.dataUrl && typeof slide.dataUrl === 'string') {
          const base64Data = slide.dataUrl.replace(/^data:image\/\w+;base64,/, '');
          parts.push({
            inline_data: {
              mime_type: 'image/png',
              data: base64Data,
            },
          });
        }
      }
    }

    const models = [
      'gemini-3.6-flash',
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
    ];

    let lastError: any = null;
    let rawResponseText = '';

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeApiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 2000,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          lastError = await response.json();
          continue;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          rawResponseText = candidate.trim();
          break;
        }
      } catch (e) {
        lastError = e;
      }
    }

    if (!rawResponseText) {
      throw new Error(lastError?.error?.message || 'Failed to generate hooks with Gemini.');
    }

    // Clean JSON response
    const cleanedJson = rawResponseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleanedJson);

    // Format all hooks with Unicode bold
    const formattedHooks = (parsed.hooks || []).map((h: any) => ({
      ...h,
      formattedHook: formatMarkdownToLinkedInBold(h.hook),
    }));

    return NextResponse.json({
      success: true,
      hooks: formattedHooks,
    });
  } catch (error: any) {
    console.error('Hook generator error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate viral hook variants.',
      },
      { status: 500 }
    );
  }
}

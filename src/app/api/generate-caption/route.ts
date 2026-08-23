import { NextRequest, NextResponse } from 'next/server';
import { formatMarkdownToLinkedInBold } from '@/lib/unicode-bold';

export async function POST(req: NextRequest) {
  try {
    const {
      topic = 'Tech & Architecture Breakdown',
      slides = [],
      authorName = 'Kamal Sharma',
      whatsappLink = 'https://tinyurl.com/mwmbwytv',
      telegramLink = 'https://tinyurl.com/6p9un6b5',
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

    const systemPrompt = `You are an elite LinkedIn copywriter writing for tech creator ${authorName}.

Topic / Carousel: ${topic}
Total Slides: ${slideCount}
${customContext ? `Context notes: ${customContext}` : ''}

MISSION:
Scan the provided slide images and craft a PUNCHY, SKIMMABLE, HIGH-IMPACT LinkedIn post (~200 - 320 words).
DO NOT write huge walls of text or overly long academic paragraphs. Keep it clean, whitespace-friendly, and actionable.

FOLLOW THIS EXACT BLUEPRINT (use markdown **bold** where text should be emphasized, it converts to LinkedIn Unicode bold):

[LINE 1 - Hook]:
**My first [Topic] took [timeframe/struggle].**

[LINE 2 - Relatable struggle]:
**[Number] of those [timeframe] were spent just [common struggle/choosing wrong tools].**

[SHORT PARAGRAPH - 2 sentences max]:
That's one of the biggest problems when you start building with [Topic]. There are dozens of tools and patterns, and it's easy to spend more time comparing frameworks than actually building the application.

[TRANSITION]:
**But [Topic] isn't a single tool.**
**It's a stack of core layers working together.**

Here's a practical breakdown of the ${slideCount > 0 ? slideCount : 'key'} patterns you need to understand:

[BULLET POINTS - 1 bullet per key slide concept, max 1-2 crisp lines each]:
✔ **[Pattern/Layer Name]** — [Crisp, high-impact 1-line explanation with tools/concepts].
✔ **[Pattern/Layer Name]** — [Crisp, high-impact 1-line explanation with tools/concepts].
✔ **[Pattern/Layer Name]** — [Crisp, high-impact 1-line explanation with tools/concepts].
✔ **[Pattern/Layer Name]** — [Crisp, high-impact 1-line explanation with tools/concepts].
✔ **[Pattern/Layer Name]** — [Crisp, high-impact 1-line explanation with tools/concepts].

[MINDSET SHIFT]:
The mistake isn't lack of tutorials.
**The mistake is trying to learn all of them at once.**

Start simple. Pick one pattern, build something small, and only add complexity when your application actually needs it.

**You don't need the perfect stack.**
**You need a stack you actually understand.**

[ENGAGEMENT]:
📌 **Save this for your next project or interview prep.**
💬 Which layer/pattern do you use the most?

[COMMUNITY FOOTER]:
**Don't miss daily tech insights & verified job opportunities:**
**WhatsApp** – ${whatsappLink} **Telegram** – ${telegramLink}

Follow **${authorName}** for more AI, RAG, Python, SQL, DSA, System Design, and Software Engineering content.

[5-6 relevant hashtags like #SystemDesign #SoftwareEngineering #Python #Coding #TechCareer]

STRICT RULES:
- Keep the post concise, clean, and punchy (~200 - 320 words).
- Do NOT output preamble (like "Here is your post:").
- Strictly close all markdown **bold** tags so every title is properly formatted.`;

    // Construct Multimodal parts array
    const parts: any[] = [{ text: systemPrompt }];

    // Attach all slide images as inlineData base64
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
    let generatedText = '';

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeApiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts,
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          lastError = errData;
          continue;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          generatedText = candidate.trim();
          break;
        }
      } catch (e) {
        lastError = e;
      }
    }

    if (!generatedText) {
      throw new Error(lastError?.error?.message || 'Failed to generate caption with Gemini Vision.');
    }

    // Convert markdown **bold** into mathematical Unicode bold for LinkedIn
    const linkedInFormattedCaption = formatMarkdownToLinkedInBold(generatedText);

    return NextResponse.json({
      success: true,
      caption: linkedInFormattedCaption,
    });
  } catch (error: any) {
    console.error('Multimodal caption generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate AI caption.',
      },
      { status: 500 }
    );
  }
}

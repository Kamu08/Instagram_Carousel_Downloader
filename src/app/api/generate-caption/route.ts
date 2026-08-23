import { NextRequest, NextResponse } from 'next/server';
import { formatMarkdownToLinkedInBold } from '@/lib/unicode-bold';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const {
      topic = '25 Patterns. Hundreds of Interview Questions.',
      slideCount = 5,
      tone = 'kamal-style',
      customContext = '',
      authorName = 'Kamal Sharma',
      whatsappLink = 'https://tinyurl.com/mwmbwytv',
      telegramLink = 'https://tinyurl.com/6p9un6b5',
    } = await req.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file.',
        },
        { status: 400 }
      );
    }

    const prompt = `You are an expert LinkedIn copywriter writing a high-performing post caption for a tech creator named ${authorName}.

Topic / Carousel Title: ${topic}
Slide Count: ${slideCount}
${customContext ? `Additional Context: ${customContext}` : ''}

You MUST follow this EXACT structural format and tone pattern (use markdown **bold** where text should be emphasized, as we convert it to LinkedIn Unicode bold):

[LINE 1]: **My first [Topic] took [timeframe/struggle].**
[LINE 2]: **[Number] of those [timeframe] were spent just [common struggle/mistake].**
[PARAGRAPH 1]: That's one of the biggest problems when you start [Topic context]. [2-3 sentences explaining why people get overwhelmed by choices/complexity].
[TRANSITION]:
**But [Topic] isn't a [single thing / simple concept].**
**It's a stack of different layers / core patterns working together.**

[BREAKDOWN HEADER]:
Here's a practical breakdown of the ${slideCount > 0 ? slideCount : 'key'} patterns/layers you need to understand:

[BULLET POINTS - Generate ${Math.min(Math.max(slideCount, 5), 8)} bullet points]:
✔ **[Concept/Pattern Name]** — [Concise explanation with real-world tools, examples, or interview uses].

[MINDSET SHIFT]:
The mistake isn't [common minor issue].
**The mistake is trying to learn all of them at once.**
Start simple.
Pick one pattern/tool, build something small, understand why each component exists, and only replace it when your application actually needs something different.

**You don't need the perfect [Topic].**
**You need a [Topic] you actually understand.**

[ENGAGEMENT]:
📌 **Save this before building your next project / preparing for interviews.**
💬 Which pattern/layer do you find the most confusing or use the most?

[FOOTER]:
**Don't miss daily tech insights & verified job opportunities:**
**WhatsApp** – ${whatsappLink} **Telegram** – ${telegramLink}

Follow **${authorName}** for more AI, RAG, Python, SQL, DSA, System Design, and Software Engineering content.

[5-6 relevant hashtags like #SystemDesign #SoftwareEngineering #Python #Coding #TechCareer]

STRICT RULES:
- Output ONLY the ready-to-post text.
- Do NOT output preamble like "Here is your post:".
- Tailor the bullet points and explanations specifically to the topic: "${topic}".`;

    const models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastError: any = null;
    let generatedText = '';

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200,
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
      throw new Error(lastError?.error?.message || 'Failed to generate caption with Gemini API.');
    }

    // Convert markdown **bold** into real mathematical Unicode bold for LinkedIn
    const linkedInFormattedCaption = formatMarkdownToLinkedInBold(generatedText);

    return NextResponse.json({
      success: true,
      caption: linkedInFormattedCaption,
    });
  } catch (error: any) {
    console.error('Caption generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate AI caption.',
      },
      { status: 500 }
    );
  }
}

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

    const systemPrompt = `You are an elite LinkedIn tech influencer and software engineering copywriter writing an authoritative, comprehensive, viral long-form post for ${authorName}.

You are provided with ${slideCount} image slides from a tech carousel.
YOUR PRIMARY MISSION:
1. THOROUGHLY SCAN AND READ EVERY SINGLE SLIDE provided in the images (transcribe diagrams, patterns, architectures, key takeaways, code concepts, and tools).
2. Write a MASTERCLASS-LEVEL, DEEP-DIVE LINKEDIN POST of MINIMUM 500 WORDS (aim for 550 - 750 words). Do NOT write a short summary. Provide rich, actionable, educational depth for every slide.

POST STRUCTURE REQUIREMENTS:

1. **VIRAL HOOK (Lines 1 & 2)**:
   **[Bold personal / counter-intuitive struggle statement about the topic].**
   **[Bold relatable statistic or mistake that 90% of engineers make].**

2. **THE CORE PROBLEM & CONTEXT (2 detailed paragraphs)**:
   Explain the real-world engineering challenge, why modern developers get overwhelmed by tools/patterns, and the costly mistakes teams make in production.

3. **THE PHILOSOPHICAL SHIFT**:
   **But [Topic] isn't [single tool / magic bullet].**
   **It's a structured system of core patterns and architectural layers working together.**

4. **SLIDE-BY-SLIDE DEEP DIVE (Cover EVERY slide scanned from the images)**:
   For EACH key concept/pattern shown in the slides, provide a detailed breakdown formatted with:
   ✔ **[Slide Concept / Pattern Name]** — [2-4 sentences explaining what it is, why it matters, real-world tools/libraries, architectural trade-offs, and when to use it in production or interview scenarios].

5. **PRODUCTION BEST PRACTICES & COMMON TRAPS**:
   Highlight 3-4 practical engineering rules (e.g. When NOT to use complex patterns, how to benchmark, monitoring, and scaling advice).

6. **THE MINDSET SHIFT**:
   The mistake isn't lack of information.
   **The mistake is trying to master everything at once without building.**
   Start simple. Master the fundamentals, understand the why behind each layer, and only add complexity when user scale demands it.
   **You don't need the most complex stack.**
   **You need a stack you actually understand and can debug in production.**

7. **ENGAGEMENT CALLOUT**:
   📌 **Save this post for your next project architecture review or tech interview prep.**
   💬 Which pattern/layer are you currently using or finding most challenging? Let's discuss in the comments!

8. **COMMUNITY & BRANDING FOOTER**:
   **Don't miss daily tech insights & verified job opportunities:**
   **WhatsApp** – ${whatsappLink} **Telegram** – ${telegramLink}

   Follow **${authorName}** for more AI, RAG, Python, SQL, DSA, System Design, and Software Engineering content.

   [6-8 relevant high-reach hashtags like #SystemDesign #SoftwareEngineering #Python #Coding #TechCareer #WebDevelopment #Programming]

RULES:
- Minimum length: 500 WORDS.
- Output ONLY the ready-to-post LinkedIn text (no preamble like "Here is the post:").
- Use markdown **bold** for key terms, titles, and hooks (it will be automatically converted to LinkedIn Unicode bold).`;

    // Construct Multimodal parts array
    const parts: any[] = [{ text: systemPrompt }];

    if (customContext) {
      parts.push({ text: `Additional User Context & Notes: ${customContext}` });
    }

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
              maxOutputTokens: 3000,
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
      throw new Error(lastError?.error?.message || 'Failed to generate multimodal caption with Gemini Vision.');
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
        error: error.message || 'Failed to generate multimodal AI caption.',
      },
      { status: 500 }
    );
  }
}

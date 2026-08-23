import { NextRequest, NextResponse } from 'next/server';
import { formatMarkdownToLinkedInBold } from '@/lib/unicode-bold';

export async function POST(req: NextRequest) {
  try {
    const {
      topic = 'SQL & System Architecture Breakdown',
      slides = [],
      authorName = 'Kamal Sharma',
      whatsappLink = 'https://tinyurl.com/mwmbwytv',
      telegramLink = 'https://tinyurl.com/6p9un6b5',
      customContext = '',
      clientApiKey = '',
      hookAngle = 'contrarian',
      customHookText = '',
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

    const slideCount = Array.isArray(slides) ? slides.length : 6;

    let hookInstruction = '';
    if (customHookText && customHookText.trim()) {
      hookInstruction = `START THE POST EXACTLY WITH THIS OPENING HOOK:\n${customHookText.trim()}\n`;
    } else {
      switch (hookAngle) {
        case 'story':
          hookInstruction = `START WITH A PERSONAL VULNERABILITY / STRUGGLE HOOK:\n**My first [Topic] took [timeframe/struggle].**\n**[Number] of those [timeframe] were spent just [common mistake/bad approach].**`;
          break;
        case 'framework':
          hookInstruction = `START WITH A CORE PATTERN CHEAT SHEET HOOK:\n**Stop grinding hundreds of random questions/tools.**\n**Mastering [Number] core [Topic] patterns is all you need to crack any interview.**`;
          break;
        case 'career':
          hookInstruction = `START WITH A SENIOR / STAFF ENGINEER MINDSET HOOK:\n**The difference between a Junior and Senior Engineer on [Topic] isn't syntax.**\n**It's understanding architectural trade-offs and knowing what NOT to build.**`;
          break;
        case 'actionable':
          hookInstruction = `START WITH A DIRECT ACTION / SPEED HACK HOOK:\n**You don't need a 40-hour course to understand [Topic].**\n**Here is the 2-minute masterclass breakdown every engineer needs:**`;
          break;
        case 'contrarian':
        default:
          hookInstruction = `START WITH A CONTRARIAN HARD-TRUTH HOOK:\n**90% of developers fail [Topic] interviews for the same avoidable reason.**\n**They spend weeks memorizing syntax instead of mastering mental models.**`;
          break;
      }
    }

    const systemPrompt = `You are an elite LinkedIn copywriter writing for tech creator ${authorName}.

Topic / Carousel: ${topic}
Total Slides Scanned: ${slideCount}
Hook Angle: ${hookAngle}
${customContext ? `Custom notes: ${customContext}` : ''}

CRITICAL RULES:
1. You MUST generate the ENTIRE post from start to finish without getting cut off.
2. The Community Footer (WhatsApp, Telegram, Follow ${authorName}, and 5 relevant hashtags) is STRICTLY MANDATORY in every response.
3. Every bullet point must be concise (1-2 lines), highly actionable, and derived from the scanned slide images.
4. Use markdown **bold** around headings and key phrases (which gets converted to mathematical Unicode bold for LinkedIn).

FOLLOW THIS TEMPLATE STRUCTURE:

${hookInstruction}

That's one of the biggest problems when you start preparing/building with [Topic]. There are dozens of tools and patterns, and it's easy to spend more time comparing frameworks than actually understanding the underlying models.

**But [Topic] mastery isn't about memorizing queries or tools.**
**It's a stack of core patterns working together.**

Here's a practical breakdown of the ${slideCount > 0 ? slideCount : 5} patterns you need to know:

✔ **[Slide 1 Pattern Name]** — [1-2 lines on what it is, practical query/architecture use, and interview tip].

✔ **[Slide 2 Pattern Name]** — [1-2 lines on what it is, practical query/architecture use, and interview tip].

✔ **[Slide 3 Pattern Name]** — [1-2 lines on what it is, practical query/architecture use, and interview tip].

✔ **[Slide 4 Pattern Name]** — [1-2 lines on what it is, practical query/architecture use, and interview tip].

✔ **[Slide 5 Pattern Name]** — [1-2 lines on what it is, practical query/architecture use, and interview tip].

The mistake isn't lack of practice problems.
**The mistake is trying to memorize every edge case at once.**

Start simple. Pick one core pattern, master why it exists, and only optimize when scale demands it.

**You don't need to memorize 500 questions.**
**You need 5 patterns you actually understand.**

📌 **Save this before your next technical interview or architecture review.**
💬 Which pattern/tool do you find the most confusing? Let's discuss below!

**Don't miss daily tech insights & verified job opportunities:**
**WhatsApp** – ${whatsappLink} **Telegram** – ${telegramLink}

Follow **${authorName}** for more AI, RAG, Python, SQL, DSA, System Design, and Software Engineering content.

#SQL #SystemDesign #Python #SoftwareEngineering #TechCareers`;

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
    let rawGeneratedText = '';

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
              maxOutputTokens: 4000,
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
          rawGeneratedText = candidate.trim();
          break;
        }
      } catch (e) {
        lastError = e;
      }
    }

    if (!rawGeneratedText) {
      throw new Error(lastError?.error?.message || 'Failed to generate caption with Gemini Vision.');
    }

    // Ensure Mandatory Community Footer is present even if model trimmed
    let fullPostText = rawGeneratedText;
    if (!fullPostText.includes(whatsappLink) || !fullPostText.includes(telegramLink)) {
      fullPostText += `\n\n📌 **Save this before your next technical interview or architecture review.**\n💬 Which pattern do you find most challenging?\n\n**Don't miss daily tech insights & verified job opportunities:**\n**WhatsApp** – ${whatsappLink} **Telegram** – ${telegramLink}\n\nFollow **${authorName}** for more AI, RAG, Python, SQL, DSA, System Design, and Software Engineering content.\n\n#SQL #SystemDesign #Python #SoftwareEngineering #TechCareers`;
    }

    // Convert markdown **bold** into mathematical Unicode bold for LinkedIn
    const linkedInFormattedCaption = formatMarkdownToLinkedInBold(fullPostText);

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

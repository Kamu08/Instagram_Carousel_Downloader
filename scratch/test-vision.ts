import fs from 'fs';

async function testVision() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
  const apiKey = match ? match[1].trim() : '';

  // Let's create a tiny 1x1 test base64 png
  const dummyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const prompt = `You are an expert LinkedIn copywriter for Kamal Sharma.
Analyze all the provided carousel images in detail and generate a comprehensive long-form LinkedIn post (MINIMUM 500 WORDS).
Cover each slide thoroughly with deep practical explanations, bullet points with ✔ **Bold Title**, mindset shifts, engagement questions, and the signature community footer.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/png',
                data: dummyBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2500,
      },
    }),
  });

  console.log('Status:', res.status);
  const data = await res.json();
  if (!res.ok) {
    console.log('Error:', JSON.stringify(data));
  } else {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const wordCount = text?.trim().split(/\s+/).length;
    console.log(`✓ Success! Generated ${wordCount} words. Preview:\n`, text?.substring(0, 200));
  }
}

testVision().catch(console.error);

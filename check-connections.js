import 'dotenv/config';

async function checkMistral() {
  const start = Date.now();

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'user', content: 'Dis juste ok' }
        ],
        max_tokens: 5
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("❌ ERROR:", data);
      return;
    }

    console.log("✅ Mistral OK");
    console.log("⏱ Latence:", Date.now() - start, "ms");

  } catch (error) {
    console.log("❌ ERREUR:", error.message);
  }
}

checkMistral();
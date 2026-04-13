import 'dotenv/config';

const provider = {
  name: 'Mistral',
  type: 'openai',
  url: 'https://api.mistral.ai/v1/chat/completions',
  key: process.env.MISTRAL_API_KEY,
  model: 'mistral-small-latest'
};

const PROMPTS = [
  'Explique le machine learning',
  'Explique-moi le machine learning',
  "Peux-tu m'expliquer le machine learning ?",
  "C'est quoi le machine learning ?",
  'Machine learning : définition et explication'
];

async function callProvider(prompt) {
  const start = Date.now();

  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 220
      })
    });

    const latency = Date.now() - start;

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      return {
        prompt,
        error: `HTTP ${response.status}`,
        latency
      };
    }

    const content = data?.choices?.[0]?.message?.content?.trim() || '';
    const tokens = data?.usage?.total_tokens ?? null;
    const firstSentence = content.split(/[.!?]/)[0]?.trim() || '';

    return {
      prompt,
      latency,
      tokens,
      length: content.length,
      firstSentence,
      content
    };
  } catch (error) {
    return {
      prompt,
      error: error.message,
      latency: Date.now() - start
    };
  }
}

function printMarkdownTable(results) {
  console.log('\nSensibilité du prompt (Mistral, temperature 0.3) :\n');
  console.log('| Formulation | Tokens | Longueur | Première phrase |');
  console.log('|-------------|--------|----------|-----------------|');

  for (const r of results) {
    if (r.error) {
      console.log(`| ${r.prompt} | - | - | ERROR: ${r.error} |`);
    } else {
      const first = r.firstSentence.replace(/\|/g, '/');
      console.log(`| ${r.prompt} | ${r.tokens ?? '-'} | ${r.length} chars | ${first} |`);
    }
  }
}

async function main() {
  const results = await Promise.all(PROMPTS.map(callProvider));

  printMarkdownTable(results);

  console.log('\nDétail des réponses :\n');

  for (const r of results) {
    console.log('─'.repeat(80));
    console.log(`Prompt : ${r.prompt}`);
    if (r.error) {
      console.log(`Erreur : ${r.error}`);
    } else {
      console.log(`Latence : ${r.latency}ms`);
      console.log(`Tokens : ${r.tokens ?? 'N/A'}`);
      console.log(`Longueur : ${r.length} caractères`);
      console.log(`Réponse : ${r.content}`);
    }
    console.log('');
  }

  console.log("Observation : la formulation impacte surtout le ton et la longueur. Le fond reste généralement proche.");
}

main();
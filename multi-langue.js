import 'dotenv/config';

const provider = {
  name: 'Mistral',
  url: 'https://api.mistral.ai/v1/chat/completions',
  key: process.env.MISTRAL_API_KEY,
  model: 'mistral-small-latest'
};

const prompts = [
  {
    langue: 'Français',
    text: "Explique simplement ce qu'est le machine learning en 2 phrases."
  },
  {
    langue: 'English',
    text: 'Explain simply what machine learning is in 2 sentences.'
  },
  {
    langue: 'Español',
    text: 'Explica de forma sencilla qué es el machine learning en 2 frases.'
  }
];

function estimateCost(totalTokens, pricePerMillion = 0.20) {
  return (totalTokens / 1_000_000) * pricePerMillion;
}

async function callMistral(promptObj) {
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
        messages: [{ role: 'user', content: promptObj.text }],
        temperature: 0.3,
        max_tokens: 120
      })
    });

    const latency = Date.now() - start;
    const data = await response.json();

    if (!response.ok) {
      return {
        langue: promptObj.langue,
        error: `HTTP ${response.status}`,
        latency
      };
    }

    const content = data?.choices?.[0]?.message?.content?.trim() || '';
    const usage = data?.usage || {};

    return {
      langue: promptObj.langue,
      latency,
      inputTokens: usage.prompt_tokens ?? null,
      outputTokens: usage.completion_tokens ?? null,
      totalTokens: usage.total_tokens ?? null,
      estimatedCost: usage.total_tokens != null
        ? estimateCost(usage.total_tokens).toFixed(8)
        : null,
      content
    };
  } catch (error) {
    return {
      langue: promptObj.langue,
      error: error.message,
      latency: Date.now() - start
    };
  }
}

function printTable(results) {
  console.log('\nMulti-langue (Mistral, même question) :\n');
  console.log('| Langue   | Tokens input | Tokens output | Coût estimé |');
  console.log('|----------|--------------|---------------|-------------|');

  for (const r of results) {
    if (r.error) {
      console.log(`| ${r.langue} | - | - | ERROR: ${r.error} |`);
    } else {
      console.log(
        `| ${r.langue} | ${r.inputTokens ?? '-'} | ${r.outputTokens ?? '-'} | ${r.estimatedCost ?? '-'}€ |`
      );
    }
  }
}

async function main() {
  const results = await Promise.all(prompts.map(callMistral));

  printTable(results);

  console.log('\nDétail des réponses :\n');

  for (const r of results) {
    console.log('─'.repeat(80));
    console.log(`Langue : ${r.langue}`);

    if (r.error) {
      console.log(`Erreur : ${r.error}`);
    } else {
      console.log(`Latence : ${r.latency}ms`);
      console.log(`Tokens input : ${r.inputTokens}`);
      console.log(`Tokens output : ${r.outputTokens}`);
      console.log(`Tokens total : ${r.totalTokens}`);
      console.log(`Coût estimé : ${r.estimatedCost}€`);
      console.log(`Réponse : ${r.content}`);
    }

    console.log('');
  }

  const fr = results.find(r => r.langue === 'Français' && !r.error);
  const en = results.find(r => r.langue === 'English' && !r.error);

  if (fr && en && fr.inputTokens && en.inputTokens) {
    const diff = (((fr.inputTokens - en.inputTokens) / en.inputTokens) * 100).toFixed(1);
    console.log(`Observation : le français consomme ${diff}% de tokens input en plus que l'anglais.`);
  } else {
    console.log("Observation : comparaison FR/EN incomplète.");
  }
}

main();
import 'dotenv/config';

const PROMPT = 'Donne-moi la capitale de la France en un mot.';

const providers = [
  {
    name: 'Mistral',
    type: 'openai',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    model: 'mistral-small-latest'
  },
  {
    name: 'Groq',
    type: 'openai',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile'
  }
];

async function callProvider(provider) {
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
        messages: [{ role: 'user', content: PROMPT }],
        temperature: 0.1,
        max_tokens: 20
      })
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        ok: false,
        latency,
        error: `HTTP ${response.status}`
      };
    }

    return {
      ok: true,
      latency
    };
  } catch (error) {
    return {
      ok: false,
      latency: Date.now() - start,
      error: error.message
    };
  }
}

function percentile95(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function stressTest(provider, n = 10) {
  const results = await Promise.allSettled(
    Array.from({ length: n }, () => callProvider(provider))
  );

  const parsed = results.map(r =>
    r.status === 'fulfilled'
      ? r.value
      : { ok: false, latency: 0, error: 'Promise rejected' }
  );

  const successes = parsed.filter(r => r.ok);
  const failures = parsed.filter(r => !r.ok);
  const latencies = successes.map(r => r.latency);
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;

  return {
    provider: provider.name,
    success: successes.length,
    failed: failures.length,
    avgLatency,
    p95: percentile95(latencies),
    errors: [...new Set(failures.map(f => f.error).filter(Boolean))]
  };
}

async function main() {
  console.log('Stress test : 10 requêtes parallèles\n');

  for (const provider of providers) {
    const result = await stressTest(provider, 10);
    console.log(
      `${result.provider} : ${result.success}/10 ${result.failed === 0 ? '✅' : '⚠️'} avg ${result.avgLatency}ms p95 ${result.p95}ms`
    );

    if (result.errors.length) {
      console.log(`Erreurs : ${result.errors.join(', ')}`);
    }

    console.log('');
  }
}

main();
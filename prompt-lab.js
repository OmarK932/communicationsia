import 'dotenv/config';

const PROVIDERS = [
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
  },
  {
    name: 'HuggingFace',
    type: 'hf',
    url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
    key: process.env.HF_API_KEY
  }
];

const TEMPERATURES = [0, 0.5, 1];
const PROMPT = "Explique ce qu'est un cookie HTTP en 2 phrases maximum.";

async function callProvider(provider, prompt, temperature) {
  const start = Date.now();

  try {
    if (!provider.key) {
      return {
        provider: provider.name,
        temperature,
        content: null,
        error: 'Clé API manquante'
      };
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.key}`
    };

    const body =
      provider.type === 'hf'
        ? {
            inputs: prompt,
            parameters: {
              max_new_tokens: 80,
              temperature: temperature === 0 ? 0.01 : temperature
            }
          }
        : {
            model: provider.model,
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: 80
          };

    const response = await fetch(provider.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
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
        provider: provider.name,
        temperature,
        content: null,
        error: `HTTP ${response.status}`,
        latency
      };
    }

    let content = '';

    if (provider.type === 'hf') {
      const generated = data?.[0]?.generated_text || '';
      content = generated.replace(prompt, '').trim();
    } else {
      content = data?.choices?.[0]?.message?.content?.trim() || '';
    }

    return {
      provider: provider.name,
      temperature,
      content,
      latency
    };
  } catch (error) {
    return {
      provider: provider.name,
      temperature,
      content: null,
      error: error.message
    };
  }
}

async function main() {
  const jobs = PROVIDERS.flatMap(provider =>
    TEMPERATURES.map(temp => callProvider(provider, PROMPT, temp))
  );

  const results = await Promise.all(jobs);

  console.log(`\nPrompt : "${PROMPT}"\n`);
  console.log('─'.repeat(80));

  for (const result of results) {
    if (result.error) {
      console.log(`${result.provider} | temp ${result.temperature} | ERROR: ${result.error}`);
    } else {
      console.log(`${result.provider} | temp ${result.temperature} | ${result.latency}ms`);
      console.log(result.content);
      console.log('─'.repeat(80));
    }
  }
}

main();
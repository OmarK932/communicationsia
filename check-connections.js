import 'dotenv/config';

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
  },
  {
    name: 'HuggingFace',
    type: 'hf',
    url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
    key: process.env.HF_API_KEY
  }
];

async function checkProvider(provider) {
  const start = Date.now();

  try {
    if (!provider.key) {
      return {
        provider: provider.name,
        status: 'ERROR',
        latency: 0,
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
            inputs: 'Dis juste ok',
            parameters: { max_new_tokens: 5 }
          }
        : {
            model: provider.model,
            messages: [{ role: 'user', content: 'Dis juste ok' }],
            max_tokens: 5
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
        status: 'ERROR',
        latency,
        error: `HTTP ${response.status}`
      };
    }

    return {
      provider: provider.name,
      status: 'OK',
      latency
    };
  } catch (error) {
    return {
      provider: provider.name,
      status: 'ERROR',
      latency: Date.now() - start,
      error: error.message
    };
  }
}

async function main() {
  const results = await Promise.all(providers.map(checkProvider));
  console.log(results);
}

main();
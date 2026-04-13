import 'dotenv/config';

const PROMPT = 'Explique le machine learning en 2 phrases.';
const TEMPERATURE = 0.3;

const providers = [
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

async function callProvider(provider, prompt) {
  const start = Date.now();

  try {
    if (!provider.key) {
      return {
        provider: provider.name,
        status: 'ERROR',
        latency: 0,
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
              temperature: TEMPERATURE
            }
          }
        : {
            model: provider.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: TEMPERATURE,
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
        status: 'ERROR',
        latency,
        content: null,
        error: `HTTP ${response.status}`
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
      status: 'OK',
      latency,
      content
    };
  } catch (error) {
    return {
      provider: provider.name,
      status: 'ERROR',
      latency: Date.now() - start,
      content: null,
      error: error.message
    };
  }
}

function summarizeDifference(results) {
  const groq = results.find(r => r.provider === 'Groq');
  const hf = results.find(r => r.provider === 'HuggingFace');

  if (!groq || !hf) {
    return "Comparaison incomplète.";
  }

  if (groq.status !== 'OK' || hf.status !== 'OK') {
    return "Comparaison partielle : un des deux hébergeurs n'a pas répondu correctement.";
  }

  const groqLen = groq.content.length;
  const hfLen = hf.content.length;
  const faster = groq.latency < hf.latency ? 'Groq' : 'HuggingFace';

  return `Latence : ${faster} plus rapide. Longueur : Groq ${groqLen} caractères, HuggingFace ${hfLen} caractères. Réponses similaires en substance, style potentiellement différent.`;
}

async function main() {
  const results = await Promise.all(providers.map(p => callProvider(p, PROMPT)));

  console.log(`Prompt : "${PROMPT}"\n`);

  for (const r of results) {
    if (r.status === 'OK') {
      console.log(`${r.provider} : ${r.latency}ms`);
      console.log(r.content);
      console.log('');
    } else {
      console.log(`${r.provider} : ERROR (${r.error})`);
      console.log('');
    }
  }

  console.log(summarizeDifference(results));
}

main();
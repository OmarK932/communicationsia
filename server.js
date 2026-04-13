import express from 'express';
import 'dotenv/config';

const app = express();
const PORT = 3000;

const providers = [
  {
    name: 'mistral',
    label: 'Mistral',
    type: 'openai',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    model: 'mistral-small-latest'
  },
  {
    name: 'groq',
    label: 'Groq',
    type: 'openai',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile'
  },
  {
    name: 'huggingface',
    label: 'HuggingFace',
    type: 'hf',
    url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
    key: process.env.HF_API_KEY
  }
];

async function checkProvider(provider, prompt = 'Donne-moi la capitale de la France en un mot') {
  const start = Date.now();

  try {
    if (!provider.key) {
      return {
        provider: provider.label,
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
            inputs: prompt,
            parameters: { max_new_tokens: 50, temperature: 0.1 }
          }
        : {
            model: provider.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 50
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
        provider: provider.label,
        status: 'ERROR',
        latency,
        error: `HTTP ${response.status}`
      };
    }

    let answer = '';

    if (provider.type === 'hf') {
      const generated = data?.[0]?.generated_text || '';
      answer = generated.replace(prompt, '').trim();
    } else {
      answer = data?.choices?.[0]?.message?.content?.trim() || '';
    }

    return {
      provider: provider.label,
      status: 'OK',
      latency,
      answer
    };
  } catch (error) {
    return {
      provider: provider.label,
      status: 'ERROR',
      latency: Date.now() - start,
      error: error.message
    };
  }
}

async function checkPinecone() {
  const start = Date.now();

  try {
    if (!process.env.PINECONE_API_KEY) {
      return {
        provider: 'Pinecone',
        status: 'ERROR',
        latency: 0,
        error: 'Clé API manquante'
      };
    }

    const response = await fetch('https://api.pinecone.io/indexes', {
      method: 'GET',
      headers: {
        'Api-Key': process.env.PINECONE_API_KEY,
        'X-Pinecone-API-Version': '2024-07'
      }
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        provider: 'Pinecone',
        status: 'ERROR',
        latency,
        error: `HTTP ${response.status}`
      };
    }

    return {
      provider: 'Pinecone',
      status: 'OK',
      latency
    };
  } catch (error) {
    return {
      provider: 'Pinecone',
      status: 'ERROR',
      latency: Date.now() - start,
      error: error.message
    };
  }
}

function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

function estimateCostData(text) {
  const tokens = estimateTokens(text);

  const providersCost = [
    { provider: 'Mistral Small', tokens, estimatedCost: `${((tokens / 1_000_000) * 0.20).toFixed(8)}€` },
    { provider: 'Groq Llama 3', tokens, estimatedCost: `${((tokens / 1_000_000) * 0.05).toFixed(8)}€` },
    { provider: 'GPT-4o', tokens, estimatedCost: `${((tokens / 1_000_000) * 2.50).toFixed(8)}€` }
  ];

  return providersCost;
}

app.get('/check', async (req, res) => {
  const providerResults = await Promise.all(providers.map(provider => checkProvider(provider)));
  const pineconeResult = await checkPinecone();

  res.json([...providerResults, pineconeResult]);
});

app.get('/ask', async (req, res) => {
  const q = req.query.q;
  const providerName = (req.query.provider || 'mistral').toLowerCase();

  if (!q) {
    return res.status(400).json({ error: 'Paramètre q manquant' });
  }

  const provider = providers.find(p => p.name === providerName);

  if (!provider) {
    return res.status(400).json({ error: 'Provider invalide' });
  }

  const result = await checkProvider(provider, q);
  res.json(result);
});

app.get('/cost', (req, res) => {
  const text = req.query.text || '';
  const result = estimateCostData(text);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
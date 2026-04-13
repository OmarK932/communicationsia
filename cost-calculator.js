function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function estimateCostForProvider(tokens, pricePerMillion) {
  return (tokens / 1_000_000) * pricePerMillion;
}

function estimateCost(text, label = 'Texte') {
  const tokens = estimateTokens(text);

  const providers = [
    { name: 'Mistral Small', price: 0.20 },
    { name: 'Groq Llama 3', price: 0.05 },
    { name: 'GPT-4o', price: 2.50 }
  ];

  console.log(`${label} : ${text.length} caractères → ~${tokens} tokens\n`);
  console.log('Provider         Coût estimé (input)   Pour 1000 requêtes');
  console.log('---------------- --------------------- -------------------');

  for (const provider of providers) {
    const oneRequest = estimateCostForProvider(tokens, provider.price);
    const thousandRequests = oneRequest * 1000;

    console.log(
      `${provider.name.padEnd(16)} ${oneRequest.toFixed(8).padEnd(21)}€ ${thousandRequests.toFixed(5)}€`
    );
  }
}

const sampleText = "Bonjour, je veux estimer le coût de ce texte pour différents providers IA.";
estimateCost(sampleText, 'Texte');
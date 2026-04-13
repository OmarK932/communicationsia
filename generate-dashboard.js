import fs from 'fs';

const allResults = {
  connections: [
    { provider: 'Mistral', status: 'OK', latency: 481, error: '' },
    { provider: 'Groq', status: 'OK', latency: 244, error: '' },
    { provider: 'HuggingFace', status: 'ERROR', latency: 281, error: 'HTTP 410' },
    { provider: 'Pinecone', status: 'OK', latency: 649, error: '' }
  ],
  multilingual: [
    { langue: 'Français', input: 29, output: 70, cost: '0.00001980€' },
    { langue: 'English', input: 27, output: 43, cost: '0.00001400€' },
    { langue: 'Español', input: 31, output: 79, cost: '0.00002200€' }
  ],
  hosting: [
    { provider: 'Groq', status: 'OK', latency: 469, note: 'Réponse correcte' },
    { provider: 'HuggingFace', status: 'ERROR', latency: 0, note: 'HTTP 410' }
  ]
};

function statusClass(status) {
  if (status === 'OK') return 'ok';
  if (status === 'ERROR') return 'error';
  return 'warn';
}

function generateTableRows(rows, columns) {
  return rows.map(row => {
    const cells = columns.map(col => `<td>${row[col] ?? ''}</td>`).join('');
    const cls = row.status ? statusClass(row.status) : '';
    return `<tr class="${cls}">${cells}</tr>`;
  }).join('\n');
}

const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Résultats Mini-Projet IA</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      background: #f8f9fb;
      color: #222;
    }
    h1, h2 {
      color: #111;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #f0f3f7;
    }
    tr.ok td {
      background: #eafaf1;
    }
    tr.error td {
      background: #fdecec;
    }
    tr.warn td {
      background: #fff7e6;
    }
    .small {
      color: #555;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>Dashboard — Mini-Projet IA</h1>
  <p class="small">Résumé visuel des phases réalisées du projet check-connections.</p>

  <div class="card">
    <h2>Connexions API</h2>
    <table>
      <thead>
        <tr>
          <th>Provider</th>
          <th>Status</th>
          <th>Latence (ms)</th>
          <th>Erreur</th>
        </tr>
      </thead>
      <tbody>
        ${generateTableRows(allResults.connections, ['provider', 'status', 'latency', 'error'])}
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>Comparaison multi-langue</h2>
    <table>
      <thead>
        <tr>
          <th>Langue</th>
          <th>Tokens input</th>
          <th>Tokens output</th>
          <th>Coût estimé</th>
        </tr>
      </thead>
      <tbody>
        ${generateTableRows(allResults.multilingual, ['langue', 'input', 'output', 'cost'])}
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>Comparaison hébergeurs</h2>
    <table>
      <thead>
        <tr>
          <th>Provider</th>
          <th>Status</th>
          <th>Latence (ms)</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        ${generateTableRows(allResults.hosting, ['provider', 'status', 'latency', 'note'])}
      </tbody>
    </table>
  </div>
</body>
</html>
`;

fs.writeFileSync('results.html', html, 'utf-8');
console.log('results.html généré avec succès.');
const fs = require('fs');
const path = require('path');
const https = require('https');

const IBGE_POPULATION_URL =
  'https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N6%5BN3%5B21%5D%5D';

const CENSUS_YEAR = '2022';

const STATE_ELECTORATE = 5186562;

const OFFICIAL_ANCHORS = {
  'São Luís': 756232,
  Imperatriz: 194881,
  'Nova Iorque': 4142,
};

const REFERENCE =
  'TSE/TRE-MA — eleitorado apto às Eleições 2026 (5.186.562 eleitores, divulgado em julho de 2026)';

const METHOD =
  'Total estadual e os municípios âncora são números oficiais. Os demais municípios são rateados pela população residente do Censo IBGE 2022, ajustados para somar exatamente o total estadual oficial.';

const outputPath = path.join(
  __dirname,
  '..',
  'src',
  'data',
  'eleitorado-ma.json',
);

const municipalitiesPath = path.join(
  __dirname,
  '..',
  'src',
  'data',
  'municipios-ma.json',
);

const normalize = value =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const fetchJson = url =>
  new Promise((resolve, reject) => {
    https
      .get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`IBGE respondeu ${response.statusCode}`));
          return;
        }
        let body = '';
        response.on('data', chunk => {
          body += chunk;
        });
        response.on('end', () => resolve(JSON.parse(body)));
      })
      .on('error', reject);
  });

const readPopulationByMunicipality = payload => {
  const series = payload[0].resultados[0].series;
  const population = {};
  for (const item of series) {
    const name = item.localidade.nome.replace(/ - MA$/, '');
    population[normalize(name)] = Number(item.serie[CENSUS_YEAR]);
  }
  return population;
};

const distributeRemainder = (electorate, names, target) => {
  const total = names.reduce((sum, name) => sum + electorate[name], 0);
  let drift = target - total;
  const ordered = [...names].sort((a, b) => electorate[b] - electorate[a]);
  let index = 0;
  while (drift !== 0) {
    const name = ordered[index % ordered.length];
    const step = drift > 0 ? 1 : -1;
    if (electorate[name] + step > 0) {
      electorate[name] += step;
      drift -= step;
    }
    index += 1;
  }
};

const buildElectorate = population => {
  const municipalities = JSON.parse(fs.readFileSync(municipalitiesPath, 'utf8'));
  const anchoredTotal = Object.values(OFFICIAL_ANCHORS).reduce(
    (sum, value) => sum + value,
    0,
  );
  const estimatedNames = municipalities.filter(
    name => !(name in OFFICIAL_ANCHORS),
  );
  const estimatedPopulation = estimatedNames.reduce(
    (sum, name) => sum + population[normalize(name)],
    0,
  );
  const remainingElectorate = STATE_ELECTORATE - anchoredTotal;

  const electorate = {};
  for (const name of municipalities) {
    electorate[name] =
      OFFICIAL_ANCHORS[name] ??
      Math.max(
        1,
        Math.round(
          (population[normalize(name)] * remainingElectorate) /
            estimatedPopulation,
        ),
      );
  }
  distributeRemainder(electorate, estimatedNames, remainingElectorate);
  return {electorate, municipalities};
};

const main = async () => {
  const payload = await fetchJson(IBGE_POPULATION_URL);
  const population = readPopulationByMunicipality(payload);
  const {electorate, municipalities} = buildElectorate(population);

  const total = municipalities.reduce((sum, name) => sum + electorate[name], 0);
  if (total !== STATE_ELECTORATE) {
    throw new Error(`Soma ${total} diferente do total oficial`);
  }

  const document = {
    origem: 'estimativa',
    referencia: REFERENCE,
    metodo: METHOD,
    atualizadoEm: new Date().toISOString().slice(0, 10),
    municipiosOficiais: Object.keys(OFFICIAL_ANCHORS),
    totalEstado: STATE_ELECTORATE,
    municipios: electorate,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
  console.log(
    `Gerado ${outputPath} — ${municipalities.length} municípios, ${total.toLocaleString('pt-BR')} eleitores.`,
  );
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});

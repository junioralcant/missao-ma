const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');

const CITY_COLUMNS = ['NM_MUNICIPIO', 'MUNICIPIO', 'NM_MUN'];

const COUNT_COLUMNS = [
  'QT_ELEITORES_PERFIL',
  'QT_ELEITORES_ALISTAMENTO',
  'QT_ELEITOR',
  'QT_ELEITORES',
];

const SEPARATOR = ';';

const ENCODING = 'latin1';

const UF_COLUMN = 'SG_UF';

const TARGET_UF = 'MA';

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
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const unquote = value => value.trim().replace(/^"|"$/g, '').trim();

const readSource = sourcePath => {
  if (sourcePath.endsWith('.zip')) {
    return execFileSync('unzip', ['-p', sourcePath], {
      encoding: ENCODING,
      maxBuffer: 1024 * 1024 * 1024,
    });
  }
  return fs.readFileSync(sourcePath, ENCODING);
};

const findColumn = (header, candidates) =>
  header.findIndex(column => candidates.includes(column.toUpperCase()));

const aggregateByCity = content => {
  const lines = content.split(/\r?\n/);
  const header = lines[0].split(SEPARATOR).map(unquote);
  const cityIndex = findColumn(header, CITY_COLUMNS);
  const countIndex = findColumn(header, COUNT_COLUMNS);
  const ufIndex = findColumn(header, [UF_COLUMN]);

  if (cityIndex === -1 || countIndex === -1) {
    throw new Error(
      `Não encontrei as colunas esperadas. Cabeçalho lido: ${header.join(', ')}`,
    );
  }

  const totals = {};
  for (const line of lines.slice(1)) {
    if (!line.trim()) {
      continue;
    }
    const columns = line.split(SEPARATOR);
    if (ufIndex !== -1 && unquote(columns[ufIndex]) !== TARGET_UF) {
      continue;
    }
    const city = normalize(unquote(columns[cityIndex]));
    const count = Number(unquote(columns[countIndex]));
    if (!city || !Number.isFinite(count)) {
      continue;
    }
    totals[city] = (totals[city] ?? 0) + count;
  }
  return totals;
};

const main = () => {
  const sourcePath = process.argv[2];
  const reference = process.argv[3];

  if (!sourcePath || !reference) {
    console.error(
      'Uso: node scripts/import-eleitorado.js <arquivo.zip|arquivo.csv> "<referência da fonte>"',
    );
    process.exit(1);
  }

  const totals = aggregateByCity(readSource(sourcePath));
  const municipalities = JSON.parse(
    fs.readFileSync(municipalitiesPath, 'utf8'),
  );

  const electorate = {};
  const missing = [];
  for (const city of municipalities) {
    const total = totals[normalize(city)];
    if (total === undefined) {
      missing.push(city);
      continue;
    }
    electorate[city] = total;
  }

  if (missing.length > 0) {
    console.warn(
      `Aviso: ${missing.length} municípios sem dado no arquivo — ${missing.join(', ')}`,
    );
  }

  const total = Object.values(electorate).reduce(
    (sum, value) => sum + value,
    0,
  );

  const document = {
    origem: 'oficial',
    referencia: reference,
    metodo: `Agregado por município a partir de ${path.basename(sourcePath)}.`,
    atualizadoEm: new Date().toISOString().slice(0, 10),
    municipiosOficiais: Object.keys(electorate),
    totalEstado: total,
    municipios: electorate,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);

  console.log(
    `Gerado ${outputPath} — ${Object.keys(electorate).length} municípios, ${total.toLocaleString('pt-BR')} eleitores.`,
  );
  console.log('Publique com git push — o deploy sincroniza o banco.');
};

main();

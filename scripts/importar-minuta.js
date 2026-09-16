const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {execFileSync} = require('child_process');

const PAGE_HEADER_LINES = ['ESTADO DO MARANHÃO', 'ASSEMBLEIA LEGISLATIVA'];

const PARAGRAPH_SPLIT_REGEX = /<w:p(?:\s[^>]*)?>/;

const TEXT_NODE_REGEX = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:br(?:\s[^>]*)?\/>|<w:tab(?:\s[^>]*)?\/>/g;

const EMENTA_PREFIX = 'Ementa:';

const TITLE_REGEX = /PROPOSTA DE EMENDA/i;

const SENTENCE_END_REGEX = /[.;:!?"”)]$/;

const LOWERCASE_START_REGEX = /^[a-zà-ÿ]/;

const XML_ENTITIES = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&amp;': '&',
};

const publicDir = path.join(__dirname, '..', 'public', 'minuta');

const outputPath = path.join(__dirname, '..', 'src', 'data', 'minuta-pec.json');

const decodeXml = value =>
  value.replace(
    /&lt;|&gt;|&quot;|&apos;|&#39;|&amp;/g,
    entity => XML_ENTITIES[entity],
  );

const isPageHeader = text =>
  PAGE_HEADER_LINES.includes(text) ||
  text === PAGE_HEADER_LINES.join(' ') ||
  PAGE_HEADER_LINES.every(line => text === line);

const extractParagraphs = xml =>
  xml
    .split(PARAGRAPH_SPLIT_REGEX)
    .slice(1)
    .map(block =>
      [...block.matchAll(TEXT_NODE_REGEX)]
        .map(match => (match[1] === undefined ? ' ' : decodeXml(match[1])))
        .join('')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(text => text && !isPageHeader(text));

const joinPageBreaks = paragraphs =>
  paragraphs.reduce((joined, text) => {
    const previous = joined[joined.length - 1];
    if (
      previous &&
      !SENTENCE_END_REGEX.test(previous) &&
      LOWERCASE_START_REGEX.test(text)
    ) {
      joined[joined.length - 1] = `${previous} ${text}`;
      return joined;
    }
    joined.push(text);
    return joined;
  }, []);

const main = () => {
  const sourcePath = process.argv[2];
  if (!sourcePath) {
    console.error('Uso: node scripts/importar-minuta.js <arquivo.docx>');
    process.exit(1);
  }

  const buffer = fs.readFileSync(sourcePath);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const xml = execFileSync('unzip', ['-p', sourcePath, 'word/document.xml'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  const paragraphs = joinPageBreaks(extractParagraphs(xml));
  const title = paragraphs.find(text => TITLE_REGEX.test(text)) ?? '';
  const ementa = (
    paragraphs.find(text => text.startsWith(EMENTA_PREFIX)) ?? ''
  ).slice(EMENTA_PREFIX.length).trim();

  const fileName = path.basename(sourcePath).replace(/\s+/g, '-');
  fs.mkdirSync(publicDir, {recursive: true});
  fs.writeFileSync(path.join(publicDir, fileName), buffer);

  const document = {
    fileName,
    downloadPath: `/minuta/${fileName}`,
    hash,
    title,
    ementa,
    paragraphs,
    importedAt: new Date().toISOString().slice(0, 10),
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);

  console.log(`Minuta importada: ${title}`);
  console.log(`  parágrafos : ${paragraphs.length}`);
  console.log(`  sha256     : ${hash}`);
  console.log(`  download   : public/minuta/${fileName}`);
  console.log(`  dados      : ${outputPath}`);
};

main();

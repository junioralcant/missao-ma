const BASE = process.env.BASE_URL || "http://localhost:3100";

const NAMES = [
  "Maria dos Santos Silva", "Antônio Pereira Lima", "Francisca Sousa Costa",
  "João Batista Ferreira", "Raimunda Nonata Alves", "José Ribamar Gomes",
  "Ana Cláudia Moreira", "Carlos Eduardo Mendes", "Luzia Maria Rocha",
  "Pedro Henrique Barros", "Rita de Cássia Nunes", "Domingos Sávio Teixeira",
  "Joana Darc Oliveira", "Sebastião Martins Dias", "Terezinha de Jesus Melo",
  "Marcos Vinícius Cunha", "Cleide Maria Fontes", "Raimundo Nonato Serra",
  "Vanessa Cristina Aguiar", "Gilberto Nascimento Pinto",
  "Benedita Alves Camargo", "Expedito Rodrigues Lopes", "Iracema Bezerra Viana",
  "Wanderley Castro Amorim", "Neuza Maria Portela", "Edmilson Araújo Brito",
  "Sandra Regina Coelho", "Válter Machado Frazão", "Elenice Cardoso Bastos",
  "Jurandir Freitas Palhano", "Noêmia Santana Correia", "Aldenor Vieira Muniz",
  "Célia Mara Trindade", "Ubiratan Lopes Furtado", "Marlene Batista Reis",
  "Genésio Andrade Queiroz", "Solange Ferreira Diniz", "Aluísio Campos Bogéa",
  "Débora Cristina Lemos", "Jailson Macêdo Guterres", "Norma Sueli Chaves",
  "Evandro Nunes Cantanhede", "Lúcia Helena Marinho", "Ozimo Gama Ribeiro",
  "Silvana Aparecida Feitosa",
];

const PLAN = [
  ["São Félix de Balsas", 12],
  ["Nova Iorque", 13],
  ["São Luís", 6],
  ["Imperatriz", 4],
  ["Timon", 3],
  ["Caxias", 2],
  ["Codó", 2],
];

const checkDigit = (digits) => {
  const weight = digits.length + 1;
  const sum = digits.reduce((acc, d, i) => acc + d * (weight - i), 0);
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
};

const makeCpf = (seed) => {
  const base = String(seed).padStart(9, "0").split("").map(Number);
  const d1 = checkDigit(base);
  const d2 = checkDigit([...base, d1]);
  return [...base, d1, d2].join("");
};

(async () => {
  let seed = 100000000;
  let ok = 0;
  for (const [city, count] of PLAN) {
    for (let i = 0; i < count; i += 1) {
      seed += 7919;
      const response = await fetch(`${BASE}/api/pec/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: NAMES[ok % NAMES.length],
          cpf: makeCpf(seed),
          city,
          consent: true,
          hasReadDocument: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("falhou", city, data);
        process.exit(1);
      }
      ok += 1;
    }
    console.log(`${city}: ${count} assinaturas`);
  }
  console.log(`total: ${ok} assinaturas ficticias`);
})();

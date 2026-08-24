import {isMaranhaoMunicipality, normalizeWhatsappLink} from '../validation';

describe('isMaranhaoMunicipality', () => {
  it('deve aceitar municípios do Maranhão com grafia exata', () => {
    expect(isMaranhaoMunicipality('São Luís')).toBe(true);
    expect(isMaranhaoMunicipality('Imperatriz')).toBe(true);
    expect(isMaranhaoMunicipality('Açailândia')).toBe(true);
  });

  it('deve rejeitar grafia com caixa ou acento diferente', () => {
    expect(isMaranhaoMunicipality('são luís')).toBe(false);
    expect(isMaranhaoMunicipality('Sao Luis')).toBe(false);
  });

  it('deve rejeitar cidade fora do Maranhão', () => {
    expect(isMaranhaoMunicipality('Teresina')).toBe(false);
    expect(isMaranhaoMunicipality('Gotham')).toBe(false);
    expect(isMaranhaoMunicipality('')).toBe(false);
  });
});

describe('normalizeWhatsappLink', () => {
  it('deve manter link canônico como está', () => {
    expect(
      normalizeWhatsappLink('https://chat.whatsapp.com/AbCdEf123456'),
    ).toBe('https://chat.whatsapp.com/AbCdEf123456');
  });

  it('deve remover query string que o WhatsApp anexa ao compartilhar', () => {
    expect(
      normalizeWhatsappLink(
        'https://chat.whatsapp.com/GG9azXgcZggHnU7qeiVUQb?mode=gi_t',
      ),
    ).toBe('https://chat.whatsapp.com/GG9azXgcZggHnU7qeiVUQb');
  });

  it('deve remover barra final e espaços nas pontas', () => {
    expect(normalizeWhatsappLink('  https://chat.whatsapp.com/AbC123/  ')).toBe(
      'https://chat.whatsapp.com/AbC123',
    );
  });

  it('deve remover fragmento', () => {
    expect(normalizeWhatsappLink('https://chat.whatsapp.com/AbC123#topo')).toBe(
      'https://chat.whatsapp.com/AbC123',
    );
  });

  it('deve rejeitar http sem TLS', () => {
    expect(normalizeWhatsappLink('http://chat.whatsapp.com/AbC123')).toBe(null);
  });

  it('deve rejeitar outros domínios', () => {
    expect(normalizeWhatsappLink('https://evil.com/AbC123')).toBe(null);
    expect(
      normalizeWhatsappLink('https://chat.whatsapp.com.evil.com/AbC'),
    ).toBe(null);
  });

  it('deve rejeitar link sem código de convite', () => {
    expect(normalizeWhatsappLink('https://chat.whatsapp.com/')).toBe(null);
    expect(normalizeWhatsappLink('https://chat.whatsapp.com')).toBe(null);
  });

  it('deve rejeitar código com segmentos extras ou caracteres inválidos', () => {
    expect(normalizeWhatsappLink('https://chat.whatsapp.com/AbC/extra')).toBe(
      null,
    );
    expect(normalizeWhatsappLink('https://chat.whatsapp.com/AbC 123')).toBe(
      null,
    );
  });

  it('deve rejeitar texto que não é URL', () => {
    expect(normalizeWhatsappLink('não é um link')).toBe(null);
    expect(normalizeWhatsappLink('')).toBe(null);
  });
});

import {getDb} from '../db';
import {
  appendSignature,
  clearDefaultGroupLink,
  confirmSignatureRequest,
  createGroup,
  deleteSignatureRequestByCpf,
  deleteGroup,
  deleteRegistration,
  getDefaultGroupLink,
  getGroupByCity,
  getGroupById,
  getRegistrationByEmail,
  getRegistrationByWhatsapp,
  getSignatureByEmail,
  getSignatureById,
  getSignatureRequestByEmail,
  getSignatureRequestByToken,
  listGroups,
  listPendingSignatureRequests,
  listRegistrations,
  listSignatures,
  setDefaultGroupLink,
  updateGroupLink,
  upsertRegistration,
  upsertSignatureRequest,
} from '../repository';

describe('repository', () => {
  beforeEach(() => {
    getDb().exec(
      'DELETE FROM registrations; DELETE FROM groups; DELETE FROM settings;',
    );
  });

  describe('grupos', () => {
    it('deve criar grupo e recuperar por cidade e por id', () => {
      const created = createGroup(
        'São Luís',
        'https://chat.whatsapp.com/AbC123',
      );

      expect(created.city).toBe('São Luís');
      expect(created.whatsappLink).toBe('https://chat.whatsapp.com/AbC123');
      expect(getGroupById(created.id)).toEqual(created);
      expect(getGroupByCity('São Luís')).toEqual(created);
    });

    it('deve listar grupos ordenados por cidade', () => {
      createGroup('Imperatriz', 'https://chat.whatsapp.com/Aaa111');
      createGroup('Caxias', 'https://chat.whatsapp.com/Bbb222');
      createGroup('Bacabal', 'https://chat.whatsapp.com/Ccc333');

      expect(listGroups().map(group => group.city)).toEqual([
        'Bacabal',
        'Caxias',
        'Imperatriz',
      ]);
    });

    it('deve atualizar apenas o link do grupo', () => {
      const created = createGroup(
        'Caxias',
        'https://chat.whatsapp.com/Antigo1',
      );
      const updated = updateGroupLink(
        created.id,
        'https://chat.whatsapp.com/Novo22',
      );

      expect(updated?.whatsappLink).toBe('https://chat.whatsapp.com/Novo22');
      expect(updated?.city).toBe('Caxias');
    });

    it('deve retornar null ao atualizar grupo inexistente', () => {
      expect(updateGroupLink(999, 'https://chat.whatsapp.com/Xyz999')).toBe(
        null,
      );
    });

    it('deve remover grupo e sinalizar quando não existe', () => {
      const created = createGroup(
        'Bacabal',
        'https://chat.whatsapp.com/Abc123',
      );

      expect(deleteGroup(created.id)).toBe(true);
      expect(getGroupById(created.id)).toBe(null);
      expect(deleteGroup(created.id)).toBe(false);
    });
  });

  describe('cadastros', () => {
    it('deve inserir cadastro novo', () => {
      upsertRegistration({
        name: 'Maria Silva',
        whatsapp: '98999887766',
        email: 'maria@exemplo.com',
        city: 'São Luís',
      });

      const registrations = listRegistrations();
      expect(registrations).toHaveLength(1);
      expect(registrations[0].name).toBe('Maria Silva');
      expect(registrations[0].whatsapp).toBe('98999887766');
      expect(registrations[0].email).toBe('maria@exemplo.com');
      expect(registrations[0].city).toBe('São Luís');
    });

    it('não deve duplicar mesmo WhatsApp na mesma cidade, apenas atualizar nome e e-mail', () => {
      upsertRegistration({
        name: 'Maria Silva',
        whatsapp: '98999887766',
        email: 'maria@exemplo.com',
        city: 'São Luís',
      });
      upsertRegistration({
        name: 'Maria S. Santos',
        whatsapp: '98999887766',
        email: 'maria.santos@exemplo.com',
        city: 'São Luís',
      });

      const registrations = listRegistrations();
      expect(registrations).toHaveLength(1);
      expect(registrations[0].name).toBe('Maria S. Santos');
      expect(registrations[0].email).toBe('maria.santos@exemplo.com');
    });

    it('não deve duplicar o mesmo WhatsApp nem em cidade diferente', () => {
      upsertRegistration({
        name: 'Maria Silva',
        whatsapp: '98999887766',
        email: 'maria@exemplo.com',
        city: 'São Luís',
      });
      upsertRegistration({
        name: 'Maria Silva',
        whatsapp: '98999887766',
        email: 'maria@exemplo.com',
        city: 'Imperatriz',
      });

      const registrations = listRegistrations();
      expect(registrations).toHaveLength(1);
      expect(registrations[0].city).toBe('São Luís');
    });

    it('deve encontrar cadastro pelo WhatsApp', () => {
      upsertRegistration({
        name: 'Maria Silva',
        whatsapp: '98999887766',
        email: 'maria@exemplo.com',
        city: 'São Luís',
      });

      expect(getRegistrationByWhatsapp('98999887766')?.name).toBe(
        'Maria Silva',
      );
      expect(getRegistrationByWhatsapp('98988776655')).toBe(null);
    });

    it('deve encontrar cadastro pelo e-mail', () => {
      upsertRegistration({
        name: 'Maria Silva',
        whatsapp: '98999887766',
        email: 'maria@exemplo.com',
        city: 'São Luís',
      });

      expect(getRegistrationByEmail('maria@exemplo.com')?.name).toBe(
        'Maria Silva',
      );
      expect(getRegistrationByEmail('outra@exemplo.com')).toBe(null);
    });

    it('não deve aceitar o mesmo e-mail em dois cadastros', () => {
      upsertRegistration({
        name: 'Maria Silva',
        whatsapp: '98999887766',
        email: 'maria@exemplo.com',
        city: 'São Luís',
      });

      expect(() =>
        upsertRegistration({
          name: 'Joao Pedro',
          whatsapp: '98988776655',
          email: 'maria@exemplo.com',
          city: 'São Luís',
        }),
      ).toThrow();
      expect(listRegistrations()).toHaveLength(1);
    });

    it('deve remover um cadastro e sinalizar quando nao existe', () => {
      upsertRegistration({
        name: 'Maria Silva',
        whatsapp: '98999887766',
        email: 'maria@exemplo.com',
        city: 'São Luís',
      });
      const id = listRegistrations()[0].id;

      expect(deleteRegistration(id)).toBe(true);
      expect(listRegistrations()).toHaveLength(0);
      expect(deleteRegistration(id)).toBe(false);
    });

    it('deve listar cadastros mais recentes primeiro', () => {
      upsertRegistration({
        name: 'Primeira Pessoa',
        whatsapp: '98999887766',
        email: 'primeira@exemplo.com',
        city: 'São Luís',
      });
      upsertRegistration({
        name: 'Segunda Pessoa',
        whatsapp: '98988776655',
        email: 'segunda@exemplo.com',
        city: 'São Luís',
      });

      expect(listRegistrations()[0].name).toBe('Segunda Pessoa');
    });
  });
});

describe('grupo padrão', () => {
  beforeEach(() => {
    getDb().exec('DELETE FROM settings;');
  });

  it('deve retornar null quando não há grupo padrão', () => {
    expect(getDefaultGroupLink()).toBe(null);
  });

  it('deve salvar e recuperar o link padrão', () => {
    setDefaultGroupLink('https://chat.whatsapp.com/Padrao1');
    expect(getDefaultGroupLink()).toBe('https://chat.whatsapp.com/Padrao1');
  });

  it('deve sobrescrever o link padrão existente', () => {
    setDefaultGroupLink('https://chat.whatsapp.com/Antigo1');
    setDefaultGroupLink('https://chat.whatsapp.com/Novo22');
    expect(getDefaultGroupLink()).toBe('https://chat.whatsapp.com/Novo22');
  });

  it('deve remover o link padrão', () => {
    setDefaultGroupLink('https://chat.whatsapp.com/Padrao1');
    clearDefaultGroupLink();
    expect(getDefaultGroupLink()).toBe(null);
  });
});

describe('repository — pedidos de assinatura', () => {
  const baseRequest = {
    name: 'Maria Silva',
    cpf: '52998224725',
    email: 'maria@exemplo.com',
    city: 'São Luís',
    tokenHash: 'hash-do-token',
    ipHash: 'hash-do-ip',
    userAgent: 'jest',
    proposalHash: 'proposta',
    documentHash: 'documento',
    consentText: 'consentimento',
    readingText: 'leitura',
    createdAt: '2026-09-21 10:00:00',
    expiresAt: '2026-09-23 10:00:00',
  };

  beforeEach(() => {
    getDb().exec('DELETE FROM signatures; DELETE FROM signature_requests;');
  });

  it('deve guardar o pedido como pendente', () => {
    upsertSignatureRequest(baseRequest);

    expect(getSignatureRequestByEmail('maria@exemplo.com')).toMatchObject({
      name: 'Maria Silva',
      cpf: '52998224725',
      city: 'São Luís',
      status: 'pending',
      confirmedAt: null,
      receipt: null,
    });
  });

  it('deve recuperar o pedido pelo hash do token', () => {
    upsertSignatureRequest(baseRequest);

    expect(getSignatureRequestByToken('hash-do-token')?.email).toBe(
      'maria@exemplo.com',
    );
    expect(getSignatureRequestByToken('outro-hash')).toBeNull();
  });

  it('deve sobrescrever o pedido do mesmo e-mail', () => {
    upsertSignatureRequest(baseRequest);
    upsertSignatureRequest({
      ...baseRequest,
      cpf: '11144477735',
      city: 'Imperatriz',
      tokenHash: 'novo-hash',
    });

    expect(getSignatureRequestByEmail('maria@exemplo.com')).toMatchObject({
      cpf: '11144477735',
      city: 'Imperatriz',
    });
    expect(getSignatureRequestByToken('hash-do-token')).toBeNull();
    expect(listPendingSignatureRequests()).toHaveLength(1);
  });

  it('deve sobrescrever o pedido do mesmo CPF com outro e-mail', () => {
    upsertSignatureRequest(baseRequest);
    upsertSignatureRequest({
      ...baseRequest,
      email: 'maria.silva@exemplo.com',
      tokenHash: 'novo-hash',
    });

    expect(getSignatureRequestByEmail('maria@exemplo.com')).toBeNull();
    expect(listPendingSignatureRequests()).toHaveLength(1);
  });

  it('deve marcar o pedido como confirmado', () => {
    upsertSignatureRequest(baseRequest);
    const pending = getSignatureRequestByEmail('maria@exemplo.com');

    confirmSignatureRequest(
      Number(pending?.id),
      'PEC-ABCDE12345',
      '2026-09-21 11:00:00',
    );

    expect(getSignatureRequestByEmail('maria@exemplo.com')).toMatchObject({
      status: 'confirmed',
      receipt: 'PEC-ABCDE12345',
      confirmedAt: '2026-09-21 11:00:00',
    });
  });

  it('não deve listar pedido confirmado entre os pendentes', () => {
    upsertSignatureRequest(baseRequest);
    const pending = getSignatureRequestByEmail('maria@exemplo.com');

    confirmSignatureRequest(
      Number(pending?.id),
      'PEC-ABCDE12345',
      '2026-09-21 11:00:00',
    );

    expect(listPendingSignatureRequests()).toHaveLength(0);
  });

  it('deve remover o pedido pelo CPF', () => {
    upsertSignatureRequest(baseRequest);

    deleteSignatureRequestByCpf('52998224725');

    expect(getSignatureRequestByEmail('maria@exemplo.com')).toBeNull();
  });

  it('deve recuperar assinatura pelo e-mail', () => {
    appendSignature(
      {
        name: 'Maria Silva',
        cpf: '52998224725',
        email: 'maria@exemplo.com',
        city: 'São Luís',
        receipt: 'PEC-ABCDE12345',
        ipHash: 'hash',
        userAgent: 'jest',
        proposalHash: 'proposta',
        documentHash: 'documento',
        consentText: 'consentimento',
        readingText: 'leitura',
        createdAt: '2026-09-21 11:00:00',
      },
      () => 'hash-da-entrada',
    );

    expect(getSignatureByEmail('maria@exemplo.com')?.receipt).toBe(
      'PEC-ABCDE12345',
    );
    expect(getSignatureByEmail('ninguem@exemplo.com')).toBeNull();
  });

  it('deve recuperar assinatura pelo id', () => {
    appendSignature(
      {
        name: 'Maria Silva',
        cpf: '52998224725',
        email: 'maria@exemplo.com',
        city: 'São Luís',
        receipt: 'PEC-ABCDE12345',
        ipHash: 'hash',
        userAgent: 'jest',
        proposalHash: 'proposta',
        documentHash: 'documento',
        consentText: 'consentimento',
        readingText: 'leitura',
        createdAt: '2026-09-21 11:00:00',
      },
      () => 'hash-da-entrada',
    );
    const [signature] = listSignatures();

    expect(getSignatureById(signature.id)?.cpf).toBe('52998224725');
    expect(getSignatureById(999)).toBeNull();
  });
});

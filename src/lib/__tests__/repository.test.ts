import {getDb} from '../db';
import {
  clearDefaultGroupLink,
  createGroup,
  deleteGroup,
  deleteRegistration,
  getDefaultGroupLink,
  getGroupByCity,
  getGroupById,
  getRegistrationByCpf,
  listGroups,
  listRegistrations,
  setDefaultGroupLink,
  updateGroupLink,
  upsertRegistration,
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
        cpf: '52998224725',
        city: 'São Luís',
      });

      const registrations = listRegistrations();
      expect(registrations).toHaveLength(1);
      expect(registrations[0].name).toBe('Maria Silva');
      expect(registrations[0].cpf).toBe('52998224725');
      expect(registrations[0].city).toBe('São Luís');
    });

    it('não deve duplicar mesmo CPF na mesma cidade, apenas atualizar o nome', () => {
      upsertRegistration({
        name: 'Maria Silva',
        cpf: '52998224725',
        city: 'São Luís',
      });
      upsertRegistration({
        name: 'Maria S. Santos',
        cpf: '52998224725',
        city: 'São Luís',
      });

      const registrations = listRegistrations();
      expect(registrations).toHaveLength(1);
      expect(registrations[0].name).toBe('Maria S. Santos');
    });

    it('não deve duplicar o mesmo CPF nem em cidade diferente', () => {
      upsertRegistration({
        name: 'Maria Silva',
        cpf: '52998224725',
        city: 'São Luís',
      });
      upsertRegistration({
        name: 'Maria Silva',
        cpf: '52998224725',
        city: 'Imperatriz',
      });

      const registrations = listRegistrations();
      expect(registrations).toHaveLength(1);
      expect(registrations[0].city).toBe('São Luís');
    });

    it('deve encontrar cadastro pelo CPF', () => {
      upsertRegistration({
        name: 'Maria Silva',
        cpf: '52998224725',
        city: 'São Luís',
      });

      expect(getRegistrationByCpf('52998224725')?.name).toBe('Maria Silva');
      expect(getRegistrationByCpf('11144477735')).toBe(null);
    });

    it('deve remover um cadastro e sinalizar quando nao existe', () => {
      upsertRegistration({
        name: 'Maria Silva',
        cpf: '52998224725',
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
        cpf: '52998224725',
        city: 'São Luís',
      });
      upsertRegistration({
        name: 'Segunda Pessoa',
        cpf: '11144477735',
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

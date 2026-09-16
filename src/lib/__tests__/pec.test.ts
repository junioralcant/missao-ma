import {
  buildProgress,
  calculateCoverageGoal,
  calculateMunicipalityGoal,
  calculateStateGoal,
} from '../pec';

const electorate = {
  'São Luís': 100000,
  Imperatriz: 50000,
  Caxias: 10000,
  Balsas: 1000,
  Barreirinhas: 1000,
};

const SPREAD_MUNICIPALITY_COUNT = 20;

const SPREAD_MUNICIPALITY_ELECTORATE = 10000;

const spreadElectorate = Object.fromEntries(
  Array.from({length: SPREAD_MUNICIPALITY_COUNT}, (unused, index) => [
    `Cidade ${index + 1}`,
    SPREAD_MUNICIPALITY_ELECTORATE,
  ]),
);

describe('pec', () => {
  describe('metas', () => {
    it('deve exigir 2% do eleitorado estadual, arredondando para cima', () => {
      expect(calculateStateGoal(5186562)).toBe(103732);
      expect(calculateStateGoal(1000)).toBe(20);
      expect(calculateStateGoal(1001)).toBe(21);
    });

    it('deve exigir 18% dos municípios, arredondando para cima', () => {
      expect(calculateCoverageGoal(217)).toBe(40);
      expect(calculateCoverageGoal(100)).toBe(18);
      expect(calculateCoverageGoal(101)).toBe(19);
    });

    it('deve exigir 0,3% dos eleitores locais, arredondando para cima', () => {
      expect(calculateMunicipalityGoal(756232)).toBe(2269);
      expect(calculateMunicipalityGoal(1000)).toBe(3);
      expect(calculateMunicipalityGoal(1001)).toBe(4);
    });
  });

  describe('buildProgress', () => {
    it('deve somar o eleitorado estadual e derivar as metas do cadastro', () => {
      const progress = buildProgress({electorate, signaturesByCity: {}});

      expect(progress.stateElectorate).toBe(162000);
      expect(progress.stateGoal).toBe(3240);
      expect(progress.municipalityCount).toBe(5);
      expect(progress.coverageGoal).toBe(1);
      expect(progress.totalSignatures).toBe(0);
    });

    it('deve qualificar apenas municípios que atingem a fração local', () => {
      const progress = buildProgress({
        electorate,
        signaturesByCity: {Balsas: 3, Caxias: 29, Barreirinhas: 2},
      });

      const byCity = Object.fromEntries(
        progress.municipalities.map(item => [item.city, item]),
      );

      expect(byCity.Balsas.goal).toBe(3);
      expect(byCity.Balsas.isQualified).toBe(true);
      expect(byCity.Caxias.goal).toBe(30);
      expect(byCity.Caxias.isQualified).toBe(false);
      expect(byCity.Barreirinhas.isQualified).toBe(false);
      expect(progress.qualifiedCount).toBe(1);
    });

    it('deve contar em signaturesInQualified só o que está em município qualificado', () => {
      const progress = buildProgress({
        electorate,
        signaturesByCity: {Balsas: 3, Caxias: 29},
      });

      expect(progress.totalSignatures).toBe(32);
      expect(progress.signaturesInQualified).toBe(3);
    });

    it('deve marcar apta a protocolo quando cobertura e total rigoroso são atingidos', () => {
      const progress = buildProgress({
        electorate: spreadElectorate,
        signaturesByCity: {
          'Cidade 1': 1000,
          'Cidade 2': 1000,
          'Cidade 3': 1000,
          'Cidade 4': 1000,
        },
      });

      expect(progress.stateGoal).toBe(4000);
      expect(progress.coverageGoal).toBe(4);
      expect(progress.qualifiedCount).toBe(4);
      expect(progress.isStateGoalMet).toBe(true);
      expect(progress.isCoverageGoalMet).toBe(true);
      expect(progress.isStrictStateGoalMet).toBe(true);
      expect(progress.isReadyToFile).toBe(true);
    });

    it('não deve considerar apta quando as assinaturas se concentram em poucos municípios', () => {
      const progress = buildProgress({
        electorate: spreadElectorate,
        signaturesByCity: {'Cidade 1': 4000},
      });

      expect(progress.totalSignatures).toBe(4000);
      expect(progress.isStateGoalMet).toBe(true);
      expect(progress.qualifiedCount).toBe(1);
      expect(progress.isCoverageGoalMet).toBe(false);
      expect(progress.isReadyToFile).toBe(false);
    });

    it('não deve considerar apta quando parte do total está em municípios sem a fração local', () => {
      const progress = buildProgress({
        electorate: spreadElectorate,
        signaturesByCity: {
          'Cidade 1': 990,
          'Cidade 2': 990,
          'Cidade 3': 990,
          'Cidade 4': 990,
          'Cidade 5': 20,
          'Cidade 6': 20,
        },
      });

      expect(progress.totalSignatures).toBe(4000);
      expect(progress.isStateGoalMet).toBe(true);
      expect(progress.qualifiedCount).toBe(4);
      expect(progress.isCoverageGoalMet).toBe(true);
      expect(progress.signaturesInQualified).toBe(3960);
      expect(progress.isStrictStateGoalMet).toBe(false);
      expect(progress.isReadyToFile).toBe(false);
    });

    it('deve ordenar os municípios pelo número de assinaturas', () => {
      const progress = buildProgress({
        electorate,
        signaturesByCity: {Caxias: 5, 'São Luís': 20, Balsas: 9},
      });

      expect(
        progress.municipalities.map(item => item.city).slice(0, 3),
      ).toEqual(['São Luís', 'Balsas', 'Caxias']);
    });

    it('deve tolerar cadastro de eleitorado vazio sem dividir por zero', () => {
      const progress = buildProgress({electorate: {}, signaturesByCity: {}});

      expect(progress.stateElectorate).toBe(0);
      expect(progress.stateGoal).toBe(0);
      expect(progress.stateRatio).toBe(0);
      expect(progress.municipalities).toEqual([]);
    });
  });
});

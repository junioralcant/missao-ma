import type {MunicipalityProgress, PecProgress, ProgressInput} from './types';

export const STATE_SIGNATURE_RATE = 0.02;

export const MUNICIPALITY_COVERAGE_RATE = 0.18;

export const MUNICIPALITY_SIGNATURE_RATE = 0.003;

export const APPRAISAL_DEADLINE_DAYS = 60;

export const calculateStateGoal = (stateElectorate: number): number =>
  Math.ceil(stateElectorate * STATE_SIGNATURE_RATE);

export const calculateCoverageGoal = (municipalityCount: number): number =>
  Math.ceil(municipalityCount * MUNICIPALITY_COVERAGE_RATE);

export const calculateMunicipalityGoal = (electorate: number): number =>
  Math.ceil(electorate * MUNICIPALITY_SIGNATURE_RATE);

const toRatio = (value: number, total: number): number =>
  total === 0 ? 0 : value / total;

const compareMunicipalities = (
  a: MunicipalityProgress,
  b: MunicipalityProgress,
): number =>
  b.signatures - a.signatures ||
  b.ratio - a.ratio ||
  a.city.localeCompare(b.city, 'pt-BR');

const toMunicipalityProgress = (
  city: string,
  electorate: number,
  signatures: number,
): MunicipalityProgress => {
  const goal = calculateMunicipalityGoal(electorate);
  return {
    city,
    electorate,
    goal,
    signatures,
    ratio: toRatio(signatures, electorate),
    isQualified: signatures >= goal,
  };
};

export const buildProgress = ({
  electorate,
  signaturesByCity,
}: ProgressInput): PecProgress => {
  const municipalities = Object.keys(electorate)
    .map(city =>
      toMunicipalityProgress(
        city,
        electorate[city],
        signaturesByCity[city] ?? 0,
      ),
    )
    .sort(compareMunicipalities);

  const stateElectorate = municipalities.reduce(
    (sum, item) => sum + item.electorate,
    0,
  );
  const totalSignatures = Object.values(signaturesByCity).reduce(
    (sum, value) => sum + value,
    0,
  );
  const qualified = municipalities.filter(item => item.isQualified);
  const signaturesInQualified = qualified.reduce(
    (sum, item) => sum + item.signatures,
    0,
  );

  const stateGoal = calculateStateGoal(stateElectorate);
  const coverageGoal = calculateCoverageGoal(municipalities.length);
  const isStateGoalMet = totalSignatures >= stateGoal;
  const isCoverageGoalMet = qualified.length >= coverageGoal;
  const isStrictStateGoalMet = signaturesInQualified >= stateGoal;

  return {
    totalSignatures,
    stateElectorate,
    stateGoal,
    stateRatio: toRatio(totalSignatures, stateElectorate),
    isStateGoalMet,
    qualifiedCount: qualified.length,
    coverageGoal,
    municipalityCount: municipalities.length,
    isCoverageGoalMet,
    signaturesInQualified,
    isStrictStateGoalMet,
    isReadyToFile: isCoverageGoalMet && isStrictStateGoalMet,
    municipalities,
  };
};

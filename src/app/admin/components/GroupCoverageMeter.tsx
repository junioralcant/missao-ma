import type {GroupCoverage} from '@/lib/types';

type GroupCoverageMeterProps = {
  coverage: GroupCoverage;
};

const FULL_BAR = 1;

const toBarWidth = (ratio: number): string =>
  `${Math.min(ratio, FULL_BAR) * 100}%`;

const toMissingLabel = (missing: number): string => {
  if (missing === 0) {
    return 'todos os municípios já têm grupo';
  }
  if (missing === 1) {
    return 'falta 1 município';
  }
  return `faltam ${missing} municípios`;
};

export const GroupCoverageMeter = ({coverage}: GroupCoverageMeterProps) => (
  <article
    className={
      coverage.missing === 0
        ? 'stat stat--done coverage-meter'
        : 'stat coverage-meter'
    }
  >
    <span className="stat-label">Municípios com grupo</span>
    <span className="stat-value">
      {coverage.covered} de {coverage.total}
    </span>
    <span className="stat-goal">{toMissingLabel(coverage.missing)}</span>
    <span className="pec-bar">
      <span
        className="pec-bar-fill"
        style={{width: toBarWidth(coverage.ratio)}}
      />
    </span>
  </article>
);

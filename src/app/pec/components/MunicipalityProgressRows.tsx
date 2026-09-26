import type {MunicipalityProgress} from '@/lib/types';
import {formatNumber, formatPercent, formatRatio} from '../format';

type MunicipalityProgressRowsProps = {
  municipalities: MunicipalityProgress[];
};

export const MunicipalityProgressRows = ({
  municipalities,
}: MunicipalityProgressRowsProps) => (
  <div className="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Município</th>
          <th>Eleitores</th>
          <th>Meta (0,3%)</th>
          <th>Assinaturas</th>
          <th>Progresso</th>
        </tr>
      </thead>
      <tbody>
        {municipalities.length === 0 ? (
          <tr>
            <td colSpan={5} className="muted">
              Nenhum município encontrado.
            </td>
          </tr>
        ) : (
          municipalities.map(municipality => (
            <tr key={municipality.city}>
              <td>
                {municipality.isQualified ? (
                  <span className="dot dot--done" aria-hidden="true" />
                ) : (
                  <span className="dot" aria-hidden="true" />
                )}
                {municipality.city}
              </td>
              <td className="mono">{formatNumber(municipality.electorate)}</td>
              <td className="mono">{formatNumber(municipality.goal)}</td>
              <td className={municipality.isQualified ? 'mono gold' : 'mono'}>
                {formatNumber(municipality.signatures)}
              </td>
              <td className="progress-cell">
                <span className="pec-bar pec-bar--thin">
                  <span
                    className="pec-bar-fill"
                    style={{
                      width: formatPercent(
                        municipality.signatures / municipality.goal,
                      ),
                    }}
                  />
                </span>
                <span className="mono">{formatRatio(municipality.ratio)}</span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

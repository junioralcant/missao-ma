import {getProposalDocument} from './document';
import {getSetting, saveProposalVersion, setSetting} from './repository';
import {buildProposalHash, nowUtc} from './signature';
import type {Proposal} from './types';

export const PROPOSAL_TITLE_KEY = 'pec_title';

export const PROPOSAL_SUMMARY_KEY = 'pec_summary';

export const PROPOSAL_DOCUMENT_URL_KEY = 'pec_document_url';

export const FALLBACK_PROPOSAL_TITLE =
  'Proposta de Emenda à Constituição do Estado do Maranhão';

export const FALLBACK_PROPOSAL_SUMMARY =
  'Proposta de iniciativa popular a ser protocolada na Assembleia Legislativa do Maranhão, nos termos do art. 41, inciso IV, da Constituição Estadual.';

export const getProposal = (): Proposal => {
  const document = getProposalDocument();
  const title =
    getSetting(PROPOSAL_TITLE_KEY) ?? document.title ?? FALLBACK_PROPOSAL_TITLE;
  const summary =
    getSetting(PROPOSAL_SUMMARY_KEY) ??
    document.ementa ??
    FALLBACK_PROPOSAL_SUMMARY;
  const documentUrl = getSetting(PROPOSAL_DOCUMENT_URL_KEY) ?? '';
  return {
    title,
    summary,
    documentUrl,
    documentHash: document.hash,
    hash: buildProposalHash(title, summary, documentUrl, document.hash),
  };
};

export const saveProposal = (
  title: string,
  summary: string,
  documentUrl: string,
): Proposal => {
  setSetting(PROPOSAL_TITLE_KEY, title);
  setSetting(PROPOSAL_SUMMARY_KEY, summary);
  setSetting(PROPOSAL_DOCUMENT_URL_KEY, documentUrl);

  const proposal = getProposal();
  saveProposalVersion({
    hash: proposal.hash,
    title: proposal.title,
    summary: proposal.summary,
    documentUrl: proposal.documentUrl,
    createdAt: nowUtc(),
  });
  return proposal;
};

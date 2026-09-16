import minuta from '@/data/minuta-pec.json';
import type {ProposalDocument} from './types';

export const ARTICLE_HEADING_REGEX = /^"?Art\.\s/;

export const getProposalDocument = (): ProposalDocument => minuta;

export const isArticleHeading = (paragraph: string): boolean =>
  ARTICLE_HEADING_REGEX.test(paragraph);

import { GLOSSARY, type GlossaryKey } from '@/lib/glossary';
import { InfoTip } from './Tooltip';

/** Glossary-backed info tooltip. */
export function Term({ k }: { k: GlossaryKey }) {
  const [term, text] = GLOSSARY[k];
  return <InfoTip term={term}>{text}</InfoTip>;
}

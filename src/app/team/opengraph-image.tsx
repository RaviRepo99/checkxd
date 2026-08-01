import {renderOgImage} from '@/lib/og-image';

export const alt = 'CITC Team';
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

export default function Image() {
  return renderOgImage({
    title: 'Meet the CITC Team',
    subtitle: 'Board of Directors, executives, and advisors at NCIT',
    label: 'Team',
  });
}

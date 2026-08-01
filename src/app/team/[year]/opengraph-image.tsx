import {renderOgImage} from '@/lib/og-image';

export const alt = 'CITC Team by year';
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const {year} = await params;
  return renderOgImage({
    title: `CITC Team ${year}`,
    subtitle: 'Board of Directors, executives, and advisors at NCIT',
    label: 'Team',
  });
}

import {createPageMetadata} from '@/lib/seo';
import DonationPageClient from './DonationPageClient';

export const metadata = createPageMetadata({
  title: 'Nepal Flood Relief Donation',
  description: 'Support communities affected by recent floods in Nepal with secure, transparent humanitarian donations.',
  path: '/donation',
  ogImagePath: '/og-image.png',
  noIndex: false,
});

export default function DonationPage() {
  return <DonationPageClient />;
}

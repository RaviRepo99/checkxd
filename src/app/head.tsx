import {SITE_CONFIG} from '@/lib/site-config';
import {getSiteUrl} from '@/lib/seo';

const siteUrl = getSiteUrl();
const ogImage = `${siteUrl}/og-banner.png`;
const pageTitle = 'CCRC IT CLUB - Empowering Students. Inspiring Innovation.';
const pageDescription =
  'Official website of CCRC IT CLUB. Explore events, innovation, AI competitions, workshops, and student projects.';

export default function Head() {
  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:site_name" content={SITE_CONFIG.name} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={pageTitle} />

      <link rel="image_src" href={ogImage} />
    </>
  );
}

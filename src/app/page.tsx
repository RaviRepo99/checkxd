import {defaultSiteMetadata} from '@/lib/seo';
import Hero from '@/components/Hero';
import HomeAbout from '@/components/HomeAbout';

export const metadata = defaultSiteMetadata;

export default function HomePage() {
  return (
    <>
      <Hero />
      <HomeAbout />
    </>
  );
}

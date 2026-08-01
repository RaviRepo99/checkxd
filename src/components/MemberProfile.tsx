import MemberProfileContent from '@/components/MemberProfileContent';
import {memberProfilePath} from '@/lib/member-slug';
import {absoluteUrl} from '@/lib/seo';
import {SITE_CONFIG} from '@/lib/site-config';
import {getMemberPhotoUrl} from '@/lib/media';
import type {Member, Team} from '@/types';

interface MemberProfileProps {
  member: Member;
  team: Team | null;
}

/** Full-page fallback for shared profile links (redirects to team + modal in normal flow). */
export default function MemberProfile({member, team}: MemberProfileProps) {
  const photoUrl = getMemberPhotoUrl(member);
  const profileUrl = absoluteUrl(memberProfilePath(member));

  const displayType = member.type === 'Mentor' ? 'Executive' : member.type;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': member.name,
    'email': member.email,
    'jobTitle': displayType,
    'url': profileUrl,
    'image': photoUrl ? absoluteUrl(photoUrl.split('?')[0] ?? photoUrl) : undefined,
    'affiliation': {
      '@type': 'Organization',
      'name': SITE_CONFIG.fullName,
      'url': SITE_CONFIG.url,
    },
    ...(team ?
      {
        memberOf: {
          '@type': 'OrganizationRole',
          'roleName': team.name,
        },
      } :
      {}),
  };

  return (
    <article className="min-h-screen pt-32 pb-20 bg-white dark:bg-citc-navy">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <div className="site-container max-w-3xl">
        <MemberProfileContent member={member} team={team} />
      </div>
    </article>
  );
}

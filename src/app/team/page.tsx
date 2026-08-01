import type {Metadata} from 'next';
import {Suspense} from 'react';
import {db} from '@/db';
import {teams, members} from '@/db/schema';
import {createPageMetadata} from '@/lib/seo';
import TeamClient from './TeamClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  title: 'Meet the Team | CITC',
  description:
    'Meet CITC board members, executives, and advisors at Nepal College of Information Technology. Browse rosters by academic year.',
  path: '/team',
  ogImagePath: '/team/opengraph-image',
});

type PageProps = {
  searchParams: Promise<{ member?: string }>;
};

export default async function TeamPage({searchParams}: PageProps) {
  const {member: memberSlug} = await searchParams;
  const allTeams = await db
      .select()
      .from(teams)
      .orderBy(teams.year);
  const allMembers = await db
      .select()
      .from(members)
      .orderBy(members.name);

  const teamData = {teams: allTeams, members: allMembers};
  return (
    <Suspense fallback={null}>
      <TeamClient
        teamData={teamData}
        initialMemberSlug={memberSlug ?? null}
      />
    </Suspense>
  );
}

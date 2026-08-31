import type {Metadata} from 'next';
import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {db} from '@/db';
import {members, teams} from '@/db/schema';
import {createPageMetadata} from '@/lib/seo';
import {sortYearsDesc} from '@/lib/years';
import TeamClient from '../TeamClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ member?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const {year} = await params;
  const yearNum = Number(year);
  if (!Number.isFinite(yearNum)) {
    return {title: 'Team | CCRC IT CLUB'};
  }

  return createPageMetadata({
    title: `CCRC IT CLUB Team ${yearNum}`,
    description: `Meet the CCRC IT CLUB ${yearNum} roster — board members, executives, and advisors at Nepal College of Information Technology.`,
    path: `/team/${yearNum}`,
    ogImagePath: '/og-image.png',
  });
}

export default async function TeamYearPage({params, searchParams}: PageProps) {
  const {year} = await params;
  const {member: memberSlug} = await searchParams;
  const yearNum = Number(year);
  if (!Number.isFinite(yearNum)) notFound();

  const allTeams = await db.select().from(teams).orderBy(teams.year);
  const allMembers = await db.select().from(members).orderBy(members.name);

  const years = sortYearsDesc(allMembers.map((m) => m.memberYear));
  if (!years.includes(yearNum)) notFound();

  return (
    <Suspense fallback={null}>
      <TeamClient
        teamData={{teams: allTeams, members: allMembers}}
        initialYear={yearNum}
        initialMemberSlug={memberSlug ?? null}
      />
    </Suspense>
  );
}

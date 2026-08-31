import type {Metadata} from 'next';
import {db} from '@/db';
import {events} from '@/db/schema';
import {desc} from 'drizzle-orm';
import {createPageMetadata} from '@/lib/seo';
import EventsClient from './EventsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  title: 'Events - CCRC IT CLUB',
  description:
    'Workshops, competitions, and club events from the Computer Science Innovation & Tech Club at CCRC.',
  path: '/events',
  ogImagePath: '/og-image.png',
});

export default async function EventsPage() {
  const allEvents = await db
      .select()
      .from(events)
      .orderBy(desc(events.date));

  return <EventsClient events={allEvents} />;
}

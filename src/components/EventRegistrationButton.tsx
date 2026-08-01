'use client';

import {ArrowRight} from 'lucide-react';
import Link from 'next/link';

interface EventRegistrationButtonProps {
  href: string;
  className: string;
  iconClassName?: string;
  label?: string;
  eventSlug?: string;
}

export default function EventRegistrationButton({
  href,
  className,
  iconClassName = 'w-4 h-4',
  label = 'Register Now',
  eventSlug,
}: EventRegistrationButtonProps) {
  const isTallyLink = href?.includes('tally.so');

  const arrowClass = `${iconClassName} transition-transform duration-200 ease-out group-hover:translate-x-1`;

  if (isTallyLink && eventSlug) {
    return (
      <Link
        href={`/events/${eventSlug}/register`}
        className={className}
      >
        {label} <ArrowRight className={arrowClass} />
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label} <ArrowRight className={arrowClass} />
    </a>
  );
}


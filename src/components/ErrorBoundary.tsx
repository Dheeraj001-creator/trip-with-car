import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

function isIgnorableDomError(error: unknown): boolean {
  const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error || '');
  return (
    msg.includes('removeChild') ||
    msg.includes('insertBefore') ||
    msg.includes('NotFoundError') ||
    msg.includes('The node to be removed is not a child')
  );
}

function sanitizeCorruptedLocalStorage() {
  if (typeof window === 'undefined') return;
  try {
    const rawBookings = localStorage.getItem('tripwithcar_user_bookings');
    if (rawBookings) {
      const parsed = JSON.parse(rawBookings);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem('tripwithcar_user_bookings');
      } else {
        const cleaned = parsed.filter(
          (b) =>
            b &&
            typeof b === 'object' &&
            typeof b.bookingId === 'string' &&
            typeof b.createdAt === 'string'
        );
        localStorage.setItem('tripwithcar_user_bookings', JSON.stringify(cleaned));
      }
    }
  } catch {
    try {
      localStorage.removeItem('tripwithcar_user_bookings');
    } catch {}
  }

  try {
    const rawReviews = localStorage.getItem('twc_custom_reviews');
    if (rawReviews) {
      const parsed = JSON.parse(rawReviews);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem('twc_custom_reviews');
      }
    }
  } catch {
    try {
      localStorage.removeItem('twc_custom_reviews');
    } catch {}
  }
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    if (isIgnorableDomError(error)) {
      return { hasError: false };
    }
    return { hasError: false, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isIgnorableDomError(error)) {
      return;
    }
    console.warn('Recovered UI boundary warning:', error, errorInfo);
    sanitizeCorruptedLocalStorage();
  }

  public render() {
    return this.props.children;
  }
}


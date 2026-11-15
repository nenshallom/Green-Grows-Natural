import type { Metadata } from 'next';
import NotFoundClient from './NotFoundClient';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Green Grown Natural',
  description: 'The farm produce or page you are looking for could not be found. Search our catalog or return to Green Grown Natural storefront.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return <NotFoundClient />;
}

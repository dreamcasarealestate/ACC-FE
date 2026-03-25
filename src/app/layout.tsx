import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { GlobalApiLoader } from '@/components/GlobalApiLoader';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'ACC Constructions | Workforce, Attendance & Payroll',
    template: '%s | ACC Constructions',
  },
  description:
    'ACC Constructions workforce management platform to handle labour records, daily attendance, settlements, payments, and operational dashboards in one place.',
  keywords: [
    'ACC Constructions',
    'labour management',
    'attendance tracking',
    'construction payroll',
    'payment settlements',
    'workforce dashboard',
  ],
  applicationName: 'ACC Constructions',
  openGraph: {
    title: 'ACC Constructions | Workforce, Attendance & Payroll',
    description:
      'Manage labour operations with attendance tracking, payroll settlements, and real-time construction dashboards.',
    type: 'website',
    siteName: 'ACC Constructions',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ACC Constructions | Workforce, Attendance & Payroll',
    description:
      'Labour, attendance, and payment operations for construction teams in one dashboard.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <AuthProvider>
          <GlobalApiLoader />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

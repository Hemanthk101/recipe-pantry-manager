import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Savor — Recipe & Pantry Manager', description: 'Plan meals around what is already in your pantry.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }

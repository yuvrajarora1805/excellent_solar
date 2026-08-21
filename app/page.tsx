import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to dashboard for authenticated users
  // The middleware will handle redirecting unauthenticated users to login
  redirect('/dashboard');
}

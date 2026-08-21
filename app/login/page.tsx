'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md card-base p-8">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-24 h-24 flex items-center justify-center">
            <img src="/logo.png" alt="Excellent Solar Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-headline-md font-bold text-on-surface mb-2">Excellent Solar</h1>
          <p className="text-body-md text-on-surface-variant">
            Enter your credentials to access the system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-label-sm text-error bg-error-container rounded border border-error">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-label-bold text-on-surface">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@excellentsolar.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-label-bold text-on-surface">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center text-label-sm text-on-surface-variant">
            Default credentials:{' '}
            <span className="font-technical-mono text-primary-container">
              admin@excellentsolar.com / admin123
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

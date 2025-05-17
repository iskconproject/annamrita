import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';

export const LoginForm = () => {
  const [email, setEmail] = useState('arindamdawn3@gmail.com');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('LoginForm - Submitting login with email:', email);
    await login(email, password);
    console.log('LoginForm - Login function completed');
  };

  return (
    <Card className="w-full max-w-md iskcon-shadow border-0">
      <CardContent className="p-6 space-y-6 pt-8">
        <div className="mb-2 text-left">
          <h2 className="text-xl font-semibold text-iskcon-primary">Hare Krishna, Welcome Back</h2>
          <p className="text-sm text-gray-600 mt-1">Please enter your credentials to continue your seva</p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-medium text-gray-700 uppercase tracking-wider text-left block">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-iskcon-primary/30 focus-visible:ring-iskcon-primary bg-gray-50 h-11"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-medium text-gray-700 uppercase tracking-wider text-left block">
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-iskcon-primary/30 focus-visible:ring-iskcon-primary bg-gray-50 h-11"
              placeholder="Enter password"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            variant="iskcon"
            className="w-full h-11 mt-4"
          >
            {isLoading ? 'Logging in...' : 'Enter Annamrita'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col justify-center p-4 pt-0 space-y-4">
        <p className="text-xs text-center text-gray-500">
          "Food is the most basic form of charity" <br />
          © {new Date().getFullYear()} ISKCON Asansol
        </p>
      </CardFooter>
    </Card>
  );
};

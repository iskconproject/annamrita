import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const LoginForm = () => {
  const [email, setEmail] = useState('arindamdawn3@gmail.com');
  const [password, setPassword] = useState('HareKrishna@108');
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('LoginForm - Submitting login with email:', email);
    await login(email, password);
    console.log('LoginForm - Login function completed');
  };

  return (
    <Card className="w-full max-w-md iskcon-shadow">
      <CardHeader className="text-center iskcon-gradient text-white rounded-t-lg">
        <CardTitle className="text-2xl font-bold">Annamrita POS</CardTitle>
        <CardDescription className="text-white/90 font-medium">Rath Yatra Festival Management</CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="text-center mb-2">
          <h2 className="text-xl font-semibold text-iskcon-primary">Login</h2>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-iskcon-primary/30 focus-visible:ring-iskcon-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-iskcon-primary/30 focus-visible:ring-iskcon-primary"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            variant="iskcon"
            className="w-full mt-2"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center p-4 pt-0 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} ISKCON Asansol</p>
      </CardFooter>
    </Card>
  );
};

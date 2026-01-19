import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    // Check if any users exist
    window.api.checkUsersExist().then((exists) => {
      setNeedsSetup(!exists);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (needsSetup) {
        const res = await window.api.registerAdmin({ username, password });
        if (res.success) {
            setNeedsSetup(false);
            setError('Admin created! Please login.');
            setPassword('');
        } else {
            setError(res.message || 'Error creating admin');
        }
    } else {
        const res = await window.api.login({ username, password });
        if (res.success) {
            login(res.user);
        } else {
            setError(res.message || 'Invalid credentials');
        }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{needsSetup ? 'Setup Admin' : 'Login'}</CardTitle>
          <CardDescription>
            {needsSetup 
              ? 'Create the first admin account.' 
              : 'Enter your credentials to access the exchange.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="admin" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="******" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit" className="w-full">
                {needsSetup ? 'Create Account' : 'Login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

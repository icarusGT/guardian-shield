// Last updated: 26th January 2025
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FraudGraudLogo } from '@/components/FraudGraudLogo';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: error.message
      });
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description: error.message
      });
    } else {
      toast({
        title: 'Account created',
        description: 'You can now sign in with your credentials.'
      });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-fraudnet-dark relative overflow-hidden p-4">
      {/* Tile pattern overlay */}
      <div className="absolute inset-0 tile-squares-pattern" />
      
      {/* Animated gradient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl glow-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl glow-blob" style={{ animationDelay: '-7s' }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl glow-blob" style={{ animationDelay: '-12s' }} />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center mb-8 animate-hero-fade-in">
          <FraudGraudLogo size="lg" />
        </div>

        <Card className="shadow-2xl border-0 glass-card-dark animate-hero-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-white">Welcome</CardTitle>
            <CardDescription className="text-white/60">Sign in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5">
                <TabsTrigger value="signin" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/80">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-vibrant text-white font-semibold shadow-lg shadow-purple-500/25" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white/80">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail" className="text-white/80">Email</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword" className="text-white/80">Password</Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-vibrant text-white font-semibold shadow-lg shadow-purple-500/25" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
                <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex gap-2 text-sm text-purple-200">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Email prefix determines role: admin@, inv@ (investigator), audit@ (auditor), or customer (default)</span>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
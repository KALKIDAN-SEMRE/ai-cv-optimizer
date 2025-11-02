import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    // Check for email confirmation tokens in URL
    const handleEmailConfirmation = async () => {
      // Check if there's a token in the URL (email confirmation)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'signup') {
        // User confirmed email via link
        // Supabase may auto-sign them in, but we want them on login page
        toast.success("Email confirmed successfully! Please sign in with your credentials.");
        // Clear the hash from URL
        window.history.replaceState(null, '', '/auth');
        
        // If they were auto-signed in, sign them out so they can sign in manually
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.auth.signOut();
          }
        }, 1000);
      } else {
        // Check if already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/dashboard");
        }
      }
    };

    handleEmailConfirmation();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Check if this is from email confirmation
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const isEmailConfirmation = accessToken && window.location.hash.includes('type=signup');
      
      if (event === 'SIGNED_IN' && session) {
        if (isEmailConfirmation) {
          // Email confirmation - sign out and stay on login page
          toast.success("Email confirmed successfully! Please sign in.");
          window.history.replaceState(null, '', '/auth');
          // Sign them out so they can sign in manually
          setTimeout(async () => {
            await supabase.auth.signOut();
          }, 500);
        } else {
          // Normal sign in, go to dashboard
          navigate("/dashboard");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email, password, fullName });
      setIsLoading(true);

      // Attempt to sign up (Supabase will return error if user exists)
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            full_name: validated.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (signUpError) {
        // Check if error is due to existing user
        const errorMsg = signUpError.message.toLowerCase();
        if (errorMsg.includes("already registered") || 
            errorMsg.includes("already exists") ||
            errorMsg.includes("user already registered") ||
            errorMsg.includes("email address is already") ||
            errorMsg.includes("user with this email address has already been registered")) {
          toast.error("There's an account with this email. Please enter another email or sign in instead.");
          setIsLoading(false);
          return;
        } else {
          throw signUpError;
        }
      }

      // Check Supabase email confirmation requirement
      if (user) {
        // Check if email confirmation is needed
        if (user.email_confirmed_at) {
          // Already confirmed (shouldn't happen, but handle it)
          toast.success("Account created successfully!");
          navigate("/dashboard");
        } else if (user.confirmation_sent_at) {
          // Email confirmation required
          toast.success("Account created! Please confirm your email and come back to login.", {
            duration: 6000
          });
          // Switch to sign in tab after a moment
          setTimeout(() => {
            // Clear the form
            setEmail("");
            setPassword("");
            setFullName("");
            // Note: We can't directly switch tabs, but user will see the message
          }, 2000);
        } else {
          // No confirmation sent (auto-confirmed or disabled)
          toast.success("Account created successfully!");
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email, password });
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        // Check if error is due to email not confirmed
        if (error.message.includes("Email not confirmed") || 
            error.message.includes("email not confirmed") ||
            error.message.includes("Email not verified")) {
          toast.error("Please confirm your email address first. Check your inbox for the confirmation link.");
        } else if (error.message.includes("Invalid login")) {
          toast.error("Invalid email or password. Please check your credentials.");
        } else {
          throw error;
        }
        return;
      }

      // Check if user needs email confirmation
      if (data.user && !data.user.email_confirmed_at) {
        toast.error("Please confirm your email address first. Check your inbox for the confirmation link.");
        return;
      }

      // Successfully signed in
      toast.success("Signed in successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to sign in");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        <Card className="glass-card border-card-border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to AI CV Optimizer</CardTitle>
            <CardDescription>
              Sign in or create an account to save your optimized CVs
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;

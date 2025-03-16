import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Session } from "@supabase/supabase-js";

type UserRole = "Library" | "Book Store";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("Library");
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        navigate("/dashboard");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (session) {
    const from = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          },
        },
      });

      if (error) {
        if (error.message === "User already registered") {
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description:
              "This email address is already in use. Please try signing in instead.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message,
          });
        }
      } else {
        toast({
          title: "Welcome to Lexicon!",
          description: `Your account has been created successfully as a ${role}.`,
        });

        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Welcome to Lexicon!",
          description: "You've successfully signed in.",
        });

        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFormLabel = () => {
    if (role === "Library") {
      return "Name of Library";
    } else {
      return "Book Store Name";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex flex-grow items-center justify-center bg-gradient-to-br from-background to-secondary/30 px-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="flex flex-col items-center mb-8">
              <img
                src="/logo.png"
                alt="lexicon-logo"
                className="h-12 w-12 text-primary mb-2"
              />
              <h1 className="text-2xl font-bold">Lexicon</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isSignUp ? "Create a new account" : "Sign in to your account"}
              </p>
            </div>

            {isSignUp ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-foreground/90">
                    Register as
                  </Label>
                  <Select
                    value={role}
                    onValueChange={(value) => setRole(value as UserRole)}
                  >
                    <SelectTrigger className="bg-muted/50 border-muted">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Library">Library</SelectItem>
                      <SelectItem value="Book Store">Book Store</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground/90">
                    {getFormLabel()}
                  </Label>
                  <Input
                    id="name"
                    placeholder={
                      role === "Library" ? "Central Library" : "Book Haven"
                    }
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="bg-muted/50 border-muted"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup" className="text-foreground/90">
                    Email
                  </Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="bg-muted/50 border-muted"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="password-signup"
                    className="text-foreground/90"
                  >
                    Password
                  </Label>
                  <Input
                    id="password-signup"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="bg-muted/50 border-muted"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginRole" className="text-foreground/90">
                    Login as
                  </Label>
                  <Select
                    value={role}
                    onValueChange={(value) => setRole(value as UserRole)}
                  >
                    <SelectTrigger className="bg-muted/50 border-muted">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Library">Library</SelectItem>
                      <SelectItem value="Book Store">Book Store</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/90">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="bg-muted/50 border-muted"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground/90">
                      Password
                    </Label>
                    <button
                      type="button"
                      className="text-primary text-sm hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="bg-muted/50 border-muted"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? "Signing in..." : "Log in"}
                </Button>
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;

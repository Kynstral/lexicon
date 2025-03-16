import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });

    const processOAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error processing auth callback:", error);
        navigate("/auth");
      } else {
        navigate("/dashboard");
      }
    };

    processOAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-center">
        <h2 className="text-2xl font-semibold mb-2">
          Completing authentication...
        </h2>
        <p className="text-muted-foreground">
          You'll be redirected in a moment
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;

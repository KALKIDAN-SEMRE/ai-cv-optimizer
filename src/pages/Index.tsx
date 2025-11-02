import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, LayoutDashboard } from "lucide-react";
import ResumeUpload from "@/components/ResumeUpload";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import CVPreview from "@/components/CVPreview";
import { toast } from "sonner";
import { retryRequest, isRetryableError, parseErrorMessage } from "@/lib/apiUtils";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [optimizedCV, setOptimizedCV] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  const generateSessionId = () => {
    // Check if sessionId already exists, don't regenerate
    const existingId = localStorage.getItem("sessionId");
    if (existingId) {
      return existingId;
    }
    
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("sessionId", id);
    return id;
  };

  const checkUsageLimit = async () => {
    // Ensure sessionId exists before checking
    const sessionId = localStorage.getItem("sessionId") || generateSessionId();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Query for usage by session_id OR user_id (if logged in)
    let query = supabase.from("usage_tracking").select("usage_count");
    
    if (session?.user?.id) {
      // If user is logged in, check by user_id first
      const { data: userData } = await supabase
        .from("usage_tracking")
        .select("usage_count")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      if (userData) {
        setUsageCount(userData.usage_count || 0);
        return;
      }
    }
    
    // Check by session_id for anonymous users
    const { data } = await supabase
      .from("usage_tracking")
      .select("usage_count")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (data) {
      setUsageCount(data.usage_count || 0);
    } else {
      // If no record exists, initialize to 0
      setUsageCount(0);
    }
  };

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // When user logs in or signs up, refresh usage count
      if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
        checkUsageLimit();
      }
    });

    // Check usage count
    checkUsageLimit();

    return () => subscription.unsubscribe();
  }, []);

  const handleOptimize = async () => {
    if (!resumeText.trim()) {
      toast.error("Please upload or paste your resume first");
      return;
    }

    if (!jobDescription.trim()) {
      toast.error("Please provide a job description");
      return;
    }

    // Check trial limit
    if (!user && usageCount >= 3) {
      toast.error("Free trial limit reached. Please sign up to continue.");
      navigate("/auth");
      return;
    }

    // Validate environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      toast.error("Missing Supabase configuration. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.");
      console.error("Environment variables missing:", { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey 
      });
      return;
    }

    setIsOptimizing(true);

    try {
      // Use retry logic for API call
      const result = await retryRequest(
        async () => {
          console.log("Invoking edge function 'optimize-cv'...");
          const invokeResult = await supabase.functions.invoke("optimize-cv", {
            body: {
              resumeText,
              jobDescription,
              jobRole: jobRole || "Not specified",
            },
          });

          console.log("Edge function response:", invokeResult);

          if (invokeResult.error) {
            console.error("Edge function error:", invokeResult.error);
            // Only retry if error is retryable
            if (!isRetryableError(invokeResult.error)) {
              throw invokeResult.error;
            }
            // Throw error for retry logic
            const retryError: any = new Error(invokeResult.error.message || "Optimization failed");
            retryError.status = invokeResult.error.status;
            retryError.context = invokeResult.error;
            throw retryError;
          }

          return invokeResult;
        },
        3, // max retries
        1000, // initial delay
        (attempt, error) => {
          console.log(`Retry attempt ${attempt}:`, error.message);
          toast.info(`Retrying... (${attempt}/3)`);
        }
      );

      if (result.error) {
        throw result.error;
      }

      setOptimizedCV(result.data);
      
      // Update usage count
      try {
        const sessionId = localStorage.getItem("sessionId") || generateSessionId();
        await supabase.rpc("increment_usage", {
          p_session_id: sessionId,
          p_user_id: user?.id || null,
        });
        // Refresh usage count from database to ensure accuracy
        await checkUsageLimit();
      } catch (usageError) {
        console.error("Usage tracking error:", usageError);
        // Don't fail the whole operation if usage tracking fails
      }
      
      toast.success("CV optimized successfully!");
    } catch (error: any) {
      console.error("Optimization error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack,
        context: error.context,
      });
      
      const errorMessage = parseErrorMessage(error);
      
      // For edge function errors, show detailed message
      if (errorMessage.includes("Edge Function not accessible")) {
        toast.error(
          <div className="space-y-1">
            <div className="font-semibold">Edge Function Error</div>
            <div className="text-sm">{errorMessage}</div>
            <div className="text-xs text-muted-foreground mt-1">
              See EDGE_FUNCTION_TROUBLESHOOTING.md for help
            </div>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-background-elevated">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold gradient-text">AI CV Optimizer</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {!user && usageCount < 3 && (
              <span className="text-sm text-muted-foreground">
                {3 - usageCount} free trials left
              </span>
            )}
            
            {user ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/auth")}
              >
                Sign In / Sign Up
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Transform Your Resume with <span className="gradient-text">AI Power</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your resume, paste a job description, and let AI create a professionally 
          optimized CV tailored for your target role.
        </p>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            <ResumeUpload 
              onResumeTextChange={setResumeText}
              resumeText={resumeText}
            />
            
            <JobDescriptionInput
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              jobRole={jobRole}
              setJobRole={setJobRole}
            />

            <Button
              onClick={handleOptimize}
              disabled={isOptimizing || !resumeText || !jobDescription}
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              size="lg"
            >
              {isOptimizing ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                  Optimizing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Optimize My CV
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Preview */}
          <div>
            <CVPreview 
              optimizedCV={optimizedCV}
              isOptimizing={isOptimizing}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

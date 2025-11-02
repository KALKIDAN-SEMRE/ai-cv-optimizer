import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, ArrowLeft, FileText, Download, Trash2, Eye, Edit } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { generatePDF, generateDOCX, type CVData } from "@/lib/fileGenerator";
import CVPreview from "@/components/CVPreview";

interface Optimization {
  id: string;
  job_role: string;
  match_score: number;
  created_at: string;
  template_name: string;
  optimized_content: CVData;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchOptimizations(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchOptimizations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cv_optimizations")
        .select("id, job_role, match_score, created_at, template_name, optimized_content")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOptimizations(data || []);
    } catch (error: any) {
      toast.error("Failed to load your optimizations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("cv_optimizations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setOptimizations(prev => prev.filter(opt => opt.id !== id));
      toast.success("CV deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete CV");
    }
  };

  const handleDownload = async (optimization: Optimization, format: 'pdf' | 'docx') => {
    if (!optimization.optimized_content) {
      toast.error("CV data not available for download");
      return;
    }

    try {
      const jobRole = optimization.job_role || "CV";
      const timestamp = new Date(optimization.created_at).toISOString().split('T')[0];
      const filename = `optimized-cv-${jobRole.replace(/\s+/g, '-')}-${timestamp}.${format}`;

      if (format === 'pdf') {
        await generatePDF(optimization.optimized_content as CVData, filename);
        toast.success("PDF downloaded successfully!");
      } else {
        await generateDOCX(optimization.optimized_content as CVData, filename);
        toast.success("DOCX downloaded successfully!");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error(
        error instanceof Error 
          ? `Failed to download ${format.toUpperCase()}: ${error.message}` 
          : `Failed to download ${format.toUpperCase()}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border bg-background-elevated">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Optimizer
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Your <span className="gradient-text">CV Dashboard</span>
          </h1>
          <p className="text-muted-foreground">
            View and manage all your optimized CVs in one place
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your CVs...</p>
          </div>
        ) : optimizations.length === 0 ? (
          <Card className="glass-card border-card-border text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No CVs yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by optimizing your first resume!
              </p>
              <Button
                onClick={() => navigate("/")}
                className="bg-gradient-primary"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Create Your First CV
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {optimizations.map((opt) => (
              <Card key={opt.id} className="glass-card border-card-border hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {opt.job_role || "Resume"}
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(opt.created_at), "MMM dd, yyyy")}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Match Score</span>
                      <span className="text-lg font-bold text-success">
                        {opt.match_score}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Template</span>
                      <span className="text-sm capitalize">{opt.template_name}</span>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>CV Preview</DialogTitle>
                            <DialogDescription>
                              {opt.job_role || "Resume"} - {format(new Date(opt.created_at), "MMM dd, yyyy")}
                            </DialogDescription>
                          </DialogHeader>
                          {opt.optimized_content && (
                            <CVPreview 
                              optimizedCV={opt.optimized_content as CVData} 
                              isOptimizing={false} 
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(opt, 'pdf')}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(opt, 'docx')}
                        title="Download DOCX"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(opt.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

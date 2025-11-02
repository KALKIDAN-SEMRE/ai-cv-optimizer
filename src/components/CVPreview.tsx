import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generatePDF, generateDOCX, type CVData } from "@/lib/fileGenerator";

interface CVPreviewProps {
  optimizedCV: CVData | null;
  isOptimizing: boolean;
}

const CVPreview = ({ optimizedCV, isOptimizing }: CVPreviewProps) => {
  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!optimizedCV) {
      toast.error("No CV data available to download");
      return;
    }

    try {
      const jobRole = optimizedCV.header?.name || "CV";
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `optimized-cv-${jobRole.replace(/\s+/g, '-')}-${timestamp}.${format}`;

      if (format === 'pdf') {
        await generatePDF(optimizedCV, filename);
        toast.success("PDF downloaded successfully!");
      } else {
        await generateDOCX(optimizedCV, filename);
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

  if (isOptimizing) {
    return (
      <Card className="glass-card border-card-border h-full">
        <CardContent className="flex flex-col items-center justify-center py-24">
          <Sparkles className="h-16 w-16 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI is working its magic...</h3>
          <p className="text-muted-foreground text-center">
            Analyzing your resume and optimizing it for the job
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!optimizedCV) {
    return (
      <Card className="glass-card border-card-border h-full">
        <CardContent className="flex flex-col items-center justify-center py-24">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No CV Yet</h3>
          <p className="text-muted-foreground text-center">
            Upload your resume and provide a job description to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  const { header, summary, skills, experience, education, matchScore } = optimizedCV;

  return (
    <Card className="glass-card border-card-border">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Optimized CV
          </CardTitle>
          {matchScore && (
            <Badge variant="outline" className="bg-success/20 text-success border-success">
              {matchScore}% Match
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('pdf')}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('docx')}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Download DOCX
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
        {/* Header */}
        {header && (
          <div className="text-center pb-4 border-b border-card-border">
            <h2 className="text-2xl font-bold gradient-text">{header.name}</h2>
            <p className="text-muted-foreground">{header.contact}</p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary">Professional Summary</h3>
            <p className="text-sm text-foreground leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary">Key Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Professional Experience</h3>
            <div className="space-y-4">
              {experience.map((exp: any, index: number) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">{exp.title}</h4>
                    <span className="text-sm text-muted-foreground">{exp.period}</span>
                  </div>
                  <p className="text-sm text-accent">{exp.company}</p>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    {exp.highlights?.map((highlight: string, i: number) => (
                      <li key={i}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Education</h3>
            <div className="space-y-2">
              {education.map((edu: any, index: number) => (
                <div key={index}>
                  <h4 className="font-semibold">{edu.degree}</h4>
                  <p className="text-sm text-muted-foreground">
                    {edu.institution} • {edu.year}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CVPreview;

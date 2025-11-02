import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Type } from "lucide-react";
import { toast } from "sonner";
import { extractTextFromFile } from "@/lib/fileParser";

interface ResumeUploadProps {
  onResumeTextChange: (text: string) => void;
  resumeText: string;
}

const ResumeUpload = ({ onResumeTextChange, resumeText }: ResumeUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await extractTextFromFile(file);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.text) {
        onResumeTextChange(result.text);
        toast.success(`Resume extracted successfully! Found ${result.text.length} characters.`);
      } else {
        toast.warning("No text could be extracted from this file.");
      }
    } catch (error) {
      console.error("File processing error:", error);
      toast.error(
        error instanceof Error 
          ? `Failed to process file: ${error.message}` 
          : "Failed to process file"
      );
    } finally {
      setIsProcessing(false);
      // Reset file input so same file can be uploaded again
      e.target.value = "";
    }
  };

  return (
    <Card className="glass-card border-card-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Your Resume
        </CardTitle>
        <CardDescription>
          Upload your resume or paste the text below
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="paste">
              <Type className="mr-2 h-4 w-4" />
              Paste Text
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste">
            <Textarea
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => onResumeTextChange(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="upload">
            <div className="border-2 border-dashed border-card-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload PDF, DOCX, or TXT file (max 10MB)
              </p>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
                disabled={isProcessing}
              />
              <label htmlFor="resume-upload">
                <Button variant="outline" asChild disabled={isProcessing}>
                  <span>
                    {isProcessing ? "Processing..." : "Choose File"}
                  </span>
                </Button>
              </label>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ResumeUpload;

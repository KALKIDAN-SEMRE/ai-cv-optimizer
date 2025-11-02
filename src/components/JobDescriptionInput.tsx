import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Briefcase } from "lucide-react";

interface JobDescriptionInputProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  jobRole: string;
  setJobRole: (value: string) => void;
}

const jobRoles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Product Manager",
  "UX/UI Designer",
  "Marketing Manager",
  "Sales Representative",
  "Business Analyst",
  "Project Manager",
  "Software Engineer",
  "Mobile Developer",
  "Cloud Architect",
  "Security Engineer",
];

const JobDescriptionInput = ({
  jobDescription,
  setJobDescription,
  jobRole,
  setJobRole,
}: JobDescriptionInputProps) => {
  return (
    <Card className="glass-card border-card-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-accent" />
          Target Job
        </CardTitle>
        <CardDescription>
          Select a role or paste the full job description
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="job-role">Job Role (Optional)</Label>
          <Select value={jobRole} onValueChange={setJobRole}>
            <SelectTrigger id="job-role">
              <SelectValue placeholder="Select a job role..." />
            </SelectTrigger>
            <SelectContent>
              {jobRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-description">Job Description</Label>
          <Textarea
            id="job-description"
            placeholder="Paste the complete job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="min-h-[250px] font-mono text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default JobDescriptionInput;

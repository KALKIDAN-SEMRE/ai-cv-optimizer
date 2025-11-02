// Deno global type declarations for Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

import { createClient } from 'npm:@supabase/supabase-js@2';

// Get Supabase environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeminiRequest {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error("Request failed after retries");
}

async function callGemini(request: GeminiRequest, apiKey: string, model: string = "gemini-2.0-flash-exp"): Promise<any> {
  // Try v1beta API for newer models like gemini-2.0-flash-exp
  // Newer models require v1beta API version
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Gemini API error: ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) {
        // Handle specific error types
        if (errorJson.error.status === "RESOURCE_EXHAUSTED" || errorJson.error.message?.includes("quota")) {
          errorMessage = "Gemini API quota exceeded. Please check your Google Cloud billing and quota limits. For more information: https://ai.google.dev/pricing";
        } else if (errorJson.error.message) {
          errorMessage = `Gemini API error: ${errorJson.error.message}`;
        } else {
          errorMessage = `Gemini API error: ${errorText}`;
        }
      } else {
        errorMessage = `Gemini API error: ${errorText}`;
      }
    } catch {
      // If parsing fails, use the raw error text
      errorMessage = `Gemini API error: ${response.status} - ${errorText}`;
    }
    
    throw new Error(errorMessage);
  }

  return await response.json();
}


async function optimizeCVWithAI(
  resumeText: string,
  jobDescription: string,
  jobRole: string
): Promise<any> {
  const systemPrompt = `You are an expert CV/resume optimizer. Your task is to:
1. Analyze the provided resume and job description
2. Optimize the resume to highlight relevant skills and experiences for the job
3. Calculate a job match score (0-100%)
4. Return a well-structured CV in JSON format

Return ONLY valid JSON with this exact structure:
{
  "header": {
    "name": "Full Name",
    "contact": "email@example.com | phone | location"
  },
  "summary": "Professional summary optimized for the target role",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "period": "Jan 2020 - Present",
      "highlights": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "year": "2020"
    }
  ],
  "matchScore": 85
}`;

  const userPrompt = `Target Job Role: ${jobRole}

Job Description:
${jobDescription}

Current Resume:
${resumeText}

Please optimize this resume for the target job and return the structured JSON response.`;

  const fullPrompt = `${systemPrompt}

${userPrompt}`;

  const request: GeminiRequest = {
    contents: [
      {
        parts: [
          { text: fullPrompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  };

  // Get Gemini API key from environment
  const geminiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiKey) {
    throw new Error("Gemini API key not configured");
  }

  // Call Gemini with retry logic
  // Using gemini-2.0-flash-exp (newer, faster model - requires v1beta API)
  return await retryRequest(async () => {
    try {
      // Try gemini-2.0-flash-exp first
      return await callGemini(request, geminiKey, "gemini-2.0-flash-exp");
    } catch (error) {
      // Fallback to gemini-1.5-flash if 2.0 is not available
      if (error instanceof Error && error.message.includes("not found")) {
        console.log("Falling back to gemini-1.5-flash");
        return await callGemini(request, geminiKey, "gemini-1.5-flash");
      }
      throw error;
    }
  }, 3, 1000);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if request has a body
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Content-Type must be application/json" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read and parse JSON body
    let body;
    try {
      const text = await req.text();
      if (!text || text.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Request body is empty. Please provide resumeText and jobDescription." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body. Please ensure the body contains valid JSON with resumeText and jobDescription fields.",
          details: parseError instanceof Error ? parseError.message : String(parseError)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { resumeText, jobDescription, jobRole } = body;

    // Validate inputs
    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: "Resume text and job description are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if Gemini API key is configured
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ 
          error: "Gemini API key not configured. Please set GEMINI_API_KEY as a secret in Supabase" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optimize CV with retry logic
    console.log("Starting CV optimization...");
    console.log("Resume text length:", resumeText.length);
    console.log("Job description length:", jobDescription.length);
    
    const aiData = await optimizeCVWithAI(
      resumeText,
      jobDescription,
      jobRole || "Not specified"
    );
    
    console.log("AI optimization completed");

    // Log full response for debugging
    console.log("Gemini API response received");
    console.log("Response structure:", JSON.stringify(aiData, null, 2));

    // Extract content from Gemini response format
    const optimizedContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!optimizedContent) {
      console.error("No content in Gemini response");
      console.error("Full response:", JSON.stringify(aiData, null, 2));
      
      // Check if there's an error in the response
      if (aiData.error) {
        throw new Error(`Gemini API error: ${JSON.stringify(aiData.error)}`);
      }
      
      // Check if candidates array exists but is empty
      if (aiData.candidates && aiData.candidates.length === 0) {
        throw new Error("Gemini returned no candidates. Check API key and model availability.");
      }
      
      // Check if content is blocked
      if (aiData.candidates?.[0]?.finishReason === "SAFETY") {
        throw new Error("Content was blocked by Gemini safety filters. Try with different input.");
      }
      
      throw new Error(`No content returned from Gemini AI. Response structure: ${JSON.stringify(aiData)}`);
    }
    
    console.log("Extracted content length:", optimizedContent.length);

    // Parse the JSON response from AI
    let parsedCV;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = optimizedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : optimizedContent;
      parsedCV = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", optimizedContent);
      throw new Error("Failed to parse AI response");
    }

    // Get user from authorization header if available
    // Supabase passes the JWT token in the Authorization header when calling from authenticated client
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    // Validate user token if we have the necessary credentials
    if (supabaseUrl && supabaseKey && authHeader) {
      try {
        // Extract JWT token from Authorization header
        // Format: "Bearer <jwt_token>" or just "<jwt_token>"
        let token: string | null = null;
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7); // Remove "Bearer " prefix
        } else {
          token = authHeader; // Assume it's the token itself
        }

        if (token) {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (!error && user) {
            userId = user.id;
            console.log("User authenticated:", user.id);
          } else if (error) {
            console.warn("Failed to get user from token:", error.message);
            // Token might be invalid/expired - continue without user
          }
        }
      } catch (error) {
        console.error("Error validating user token:", error);
        // Continue without user - allow anonymous optimizations
      }
    }

    // Save to database if user is authenticated and we have the required keys
    if (userId && supabaseUrl && supabaseKey) {
      try {
        const { error: insertError } = await supabase.from("cv_optimizations").insert({
          user_id: userId,
          job_description: jobDescription,
          job_role: jobRole,
          optimized_content: parsedCV,
          match_score: parsedCV.matchScore || null,
          template_name: "modern",
        });

        if (insertError) {
          console.error("Failed to save optimization to database:", insertError);
          // Don't fail the request - optimization was successful
        }
      } catch (error) {
        console.error("Error saving to database:", error);
        // Don't fail the request - optimization was successful
      }
    }

    return new Response(
      JSON.stringify(parsedCV),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in optimize-cv function:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorDetails = error instanceof Error && error.stack 
      ? { message: errorMessage, stack: error.stack } 
      : { message: errorMessage };
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorDetails : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

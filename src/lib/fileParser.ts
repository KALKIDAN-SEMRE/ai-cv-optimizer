import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure PDF.js worker - use local worker file from node_modules instead of CDN
// Import the worker file as a URL using Vite's ?url suffix
// @ts-ignore - Vite handles ?url imports
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface ParseResult {
  text: string;
  error?: string;
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }
    
    return { text: fullText.trim() };
  } catch (error) {
    console.error("PDF parsing error:", error);
    return {
      text: "",
      error: error instanceof Error ? error.message : "Failed to parse PDF",
    };
  }
}

/**
 * Extract text from DOCX file
 */
export async function extractTextFromDOCX(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return { text: result.value.trim() };
  } catch (error) {
    console.error("DOCX parsing error:", error);
    return {
      text: "",
      error: error instanceof Error ? error.message : "Failed to parse DOCX",
    };
  }
}

/**
 * Extract text from TXT file
 */
export async function extractTextFromTXT(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    return { text: text.trim() };
  } catch (error) {
    console.error("TXT parsing error:", error);
    return {
      text: "",
      error: error instanceof Error ? error.message : "Failed to parse TXT",
    };
  }
}

/**
 * Extract text from file based on file type
 */
export async function extractTextFromFile(file: File): Promise<ParseResult> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // PDF
  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    return extractTextFromPDF(file);
  }

  // DOCX
  if (
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword" ||
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc")
  ) {
    return extractTextFromDOCX(file);
  }

  // TXT
  if (fileType === "text/plain" || fileName.endsWith(".txt")) {
    return extractTextFromTXT(file);
  }

  return {
    text: "",
    error: "Unsupported file type. Please upload PDF, DOCX, or TXT.",
  };
}



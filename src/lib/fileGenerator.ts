import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export interface CVData {
  header: {
    name: string;
    contact: string;
  };
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    period: string;
    highlights: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  matchScore?: number;
}

/**
 * Generate and download PDF from CV data
 */
export async function generatePDF(cvData: CVData, filename: string = "optimized-cv.pdf") {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper to add text with word wrap
    const addText = (text: string, fontSize: number, isBold: boolean = false, isHeader: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (yPosition > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.4;
      });
      yPosition += 5;
    };

    // Header
    if (cvData.header) {
      addText(cvData.header.name, 20, true);
      addText(cvData.header.contact, 11, false);
      yPosition += 10;
    }

    // Professional Summary
    if (cvData.summary) {
      addText("PROFESSIONAL SUMMARY", 14, true);
      addText(cvData.summary, 11, false);
      yPosition += 5;
    }

    // Skills
    if (cvData.skills && cvData.skills.length > 0) {
      addText("KEY SKILLS", 14, true);
      const skillsText = cvData.skills.join(" • ");
      addText(skillsText, 11, false);
      yPosition += 5;
    }

    // Experience
    if (cvData.experience && cvData.experience.length > 0) {
      addText("PROFESSIONAL EXPERIENCE", 14, true);
      cvData.experience.forEach((exp) => {
        addText(`${exp.title} | ${exp.company}`, 12, true);
        addText(exp.period, 10, false);
        exp.highlights.forEach((highlight) => {
          doc.setFontSize(10);
          doc.text("• ", margin + 5, yPosition);
          const lines = doc.splitTextToSize(highlight, maxWidth - 10);
          lines.forEach((line: string, index: number) => {
            doc.text(line, margin + 10, yPosition);
            yPosition += 5;
          });
        });
        yPosition += 5;
      });
    }

    // Education
    if (cvData.education && cvData.education.length > 0) {
      addText("EDUCATION", 14, true);
      cvData.education.forEach((edu) => {
        addText(edu.degree, 12, true);
        addText(`${edu.institution} • ${edu.year}`, 10, false);
        yPosition += 5;
      });
    }

    // Save PDF
    doc.save(filename);
    return true;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate PDF"
    );
  }
}

/**
 * Generate and download DOCX from CV data
 */
export async function generateDOCX(cvData: CVData, filename: string = "optimized-cv.docx") {
  try {
    const children: Paragraph[] = [];

    // Header
    if (cvData.header) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.header.name,
              bold: true,
              size: 32,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.header.contact,
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }

    // Professional Summary
    if (cvData.summary) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "PROFESSIONAL SUMMARY",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.summary,
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }

    // Skills
    if (cvData.skills && cvData.skills.length > 0) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "KEY SKILLS",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.skills.join(" • "),
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }

    // Experience
    if (cvData.experience && cvData.experience.length > 0) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "PROFESSIONAL EXPERIENCE",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { after: 200 },
        })
      );

      cvData.experience.forEach((exp) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${exp.title} | ${exp.company}`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: exp.period,
                size: 20,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          })
        );

        exp.highlights.forEach((highlight) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "• ",
                  bold: true,
                }),
                new TextRun({
                  text: highlight,
                  size: 22,
                }),
              ],
              indent: { left: 400 },
              spacing: { after: 150 },
            })
          );
        });

        children.push(
          new Paragraph({
            spacing: { after: 300 },
          })
        );
      });
    }

    // Education
    if (cvData.education && cvData.education.length > 0) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "EDUCATION",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { after: 200 },
        })
      );

      cvData.education.forEach((edu) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.degree,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${edu.institution} • ${edu.year}`,
                size: 20,
              }),
            ],
            spacing: { after: 300 },
          })
        );
      });
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
    return true;
  } catch (error) {
    console.error("DOCX generation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate DOCX"
    );
  }
}



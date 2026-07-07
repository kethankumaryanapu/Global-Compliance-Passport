import { z } from 'zod';
import { db } from './db';

// Zod Schema to validate AI output
export const AIExtractionResultSchema = z.object({
  documentType: z.string(),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
  extractedFields: z.record(z.string(), z.any()),
  missingFields: z.array(z.string()),
  lowConfidenceReason: z.string().nullable().optional(),
});

export interface AIExtractionResult {
  documentType: string;
  confidence: number;
  summary: string;
  extractedFields: Record<string, any>;
  missingFields: string[];
  duplicateDetected: boolean;
  processingTime: number;
}

/**
 * Triggers the LLM processing pipeline after OCR raw text extraction.
 */
export async function processDocumentAI(
  documentId: string,
  ocrText: string
): Promise<AIExtractionResult> {
  const startTime = Date.now();
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const prompt = `Analyze the following OCR extracted text from a business compliance document.
Identify the document type (must be one of: "GST Certificate", "PAN Card", "Certificate of Incorporation", "Business License", "Tax Certificate", "Financial Statements", "Director KYC", "Bank Proof", "Other").

Extract the important fields based on the type:
- GST Certificate:
  * companyName (string)
  * gstNumber (string)
  * registrationDate (string)
  * state (string)
  * address (string)
- PAN Card:
  * panNumber (string)
  * name (string)
- Certificate of Incorporation:
  * cin (string)
  * companyName (string)
  * date (string)
- Bank Proof:
  * bankName (string)
  * accountHolder (string)
  * accountNumber (string - MUST mask all digits except the last 4 digits, e.g. "********1234")
- Director KYC:
  * directorName (string)
  * dob (string)
  * address (string)
  * idNumber (string - MUST mask sensitive ID values, e.g. "******5678")
- Business License:
  * licenseNumber (string)
  * businessName (string)
  * expiryDate (string)
- Tax Certificate:
  * taxId (string)
  * name (string)
  * expiryDate (string)
- Financial Statements:
  * companyName (string)
  * fiscalYear (string)
  * totalRevenue (string)
- Other:
  * documentName (string)
  * description (string)

Provide a concise 1-2 sentence document summary.
Detect any missing required fields from the expected fields listed above for the identified document type.
Generate an AI confidence score (0-100) based on text clarity and completeness.
Explain why confidence is low in lowConfidenceReason (if confidence is below 80).

Return ONLY a valid JSON object matching the following structure:
{
  "documentType": "...",
  "confidence": 0-100,
  "summary": "...",
  "extractedFields": { ... },
  "missingFields": ["..."],
  "lowConfidenceReason": "..." (or null)
}

OCR Extracted Text:
${ocrText}`;

  let attempts = 0;
  const maxAttempts = 2;
  let lastError: any = null;
  let parsedResult: any = null;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsedJSON = JSON.parse(rawText.trim());

      // Validate structured output via Zod
      parsedResult = AIExtractionResultSchema.parse(parsedJSON);
      break; // Successful request & validation, exit loop
    } catch (error) {
      lastError = error;
      attempts++;
      if (attempts < maxAttempts) {
        console.warn(`Transient AI processing error (attempt ${attempts}): ${error}. Retrying...`);
        await new Promise((res) => setTimeout(res, 500)); // Delay before retry
      }
    }
  }

  if (!parsedResult) {
    console.error('AI structuring pipeline failed after retries:', lastError);
    throw new Error(`AI processing failed: ${lastError?.message || lastError}`);
  }

  const processingTime = Date.now() - startTime;
  console.log(`[AI Pipeline] Document ${documentId} structured in ${processingTime}ms`);

  // Detect duplicate documents using database records
  let duplicateDetected = false;
  const fields = parsedResult.extractedFields || {};
  const checkIdentifier =
    fields.gstNumber ||
    fields.gstin ||
    fields.panNumber ||
    fields.pan ||
    fields.cin ||
    fields.licenseNumber ||
    fields.passportNumber ||
    fields.taxId ||
    fields.taxpayerId ||
    fields.idNumber ||
    fields.accountNumber;

  if (checkIdentifier) {
    const duplicateDoc = await db.document.findFirst({
      where: {
        id: { not: documentId },
        status: { in: ['VERIFIED', 'AI_VALIDATED', 'Verified'] },
        ocrData: {
          contains: String(checkIdentifier),
        },
      },
    });
    if (duplicateDoc) {
      duplicateDetected = true;
    }
  }

  // Save results to PostgreSQL / SQLite via Prisma AIExtraction model
  await db.aIExtraction.upsert({
    where: { documentId },
    update: {
      documentType: parsedResult.documentType,
      summary: parsedResult.summary,
      confidence: parsedResult.confidence,
      extractedFields: JSON.stringify(fields),
      missingFields: JSON.stringify(parsedResult.missingFields || []),
      duplicateDetected,
      processingTime,
    },
    create: {
      documentId,
      documentType: parsedResult.documentType,
      summary: parsedResult.summary,
      confidence: parsedResult.confidence,
      extractedFields: JSON.stringify(fields),
      missingFields: JSON.stringify(parsedResult.missingFields || []),
      duplicateDetected,
      processingTime,
    },
  });

  return {
    documentType: parsedResult.documentType,
    confidence: parsedResult.confidence,
    summary: parsedResult.summary,
    extractedFields: fields,
    missingFields: parsedResult.missingFields || [],
    duplicateDetected,
    processingTime,
  };
}

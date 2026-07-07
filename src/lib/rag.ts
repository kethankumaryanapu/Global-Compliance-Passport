import { db } from './db';

interface RAGResponse {
  answer: string;
  country: string;
  availableDocs: string[];
  missingDocs: string[];
  estimatedScore: number;
  nextSteps: string[];
}

export async function queryComplianceAdvisor(
  query: string,
  companyId: string
): Promise<RAGResponse | null> {
  const lowerQuery = query.toLowerCase();

  // Determine target country from the RAG search query
  let targetCountry = '';
  if (lowerQuery.includes('india')) targetCountry = 'India';
  else if (
    lowerQuery.includes('usa') ||
    lowerQuery.includes('united states') ||
    lowerQuery.includes('us') ||
    lowerQuery.includes('america')
  ) {
    targetCountry = 'USA';
  } else if (lowerQuery.includes('germany') || lowerQuery.includes('german') || lowerQuery.includes('deutschland')) {
    targetCountry = 'Germany';
  } else if (lowerQuery.includes('singapore') || lowerQuery.includes('sg') || lowerQuery.includes('acra')) {
    targetCountry = 'Singapore';
  } else if (
    lowerQuery.includes('uae') ||
    lowerQuery.includes('dubai') ||
    lowerQuery.includes('emirates') ||
    lowerQuery.includes('abu dhabi')
  ) {
    targetCountry = 'UAE';
  }

  if (!targetCountry) {
    return null;
  }

  // Retrieve country rules from DB
  const rulesRecord = await db.countryComplianceRules.findUnique({
    where: { country: targetCountry },
  });

  if (!rulesRecord) {
    return null;
  }

  const rules = JSON.parse(rulesRecord.rules);
  const requiredDocs: string[] = rules.requiredDocuments;

  // Retrieve startup's current verified documents
  const startupDocs = await db.document.findMany({
    where: {
      companyId,
      status: { in: ['VERIFIED', 'AI_VALIDATED', 'Verified'] },
    },
  });

  const startupDocTypes = startupDocs.map((d) => d.type);

  // Cross-reference documents to find match gaps
  const availableDocs: string[] = [];
  const missingDocs: string[] = [];

  for (const req of requiredDocs) {
    if (startupDocTypes.includes(req)) {
      availableDocs.push(req);
    } else {
      missingDocs.push(req);
    }
  }

  // Calculate compliance score
  const totalRequired = requiredDocs.length;
  const totalVerifiedAvailable = availableDocs.length;
  const estimatedScore =
    totalRequired > 0 ? Math.round((totalVerifiedAvailable / totalRequired) * 100) : 0;

  // Formulate next steps and advice
  const nextSteps: string[] = [];
  if (missingDocs.length > 0) {
    nextSteps.push(`Upload the missing documents: ${missingDocs.map((d) => `**${d}**`).join(', ')}.`);
    for (const missing of missingDocs) {
      if (rules.guidelines && rules.guidelines[missing]) {
        nextSteps.push(`Provide **${missing}**: ${rules.guidelines[missing]}`);
      }
    }
  } else {
    nextSteps.push(
      `Congratulations! All required documents for expansion to **${targetCountry}** are verified in your Passport.`
    );
  }
  nextSteps.push(
    `Proceed to request validation from the **${rules.regulatoryBody}** local sandbox partner program.`
  );

  const availableDocsStr =
    availableDocs.length > 0
      ? availableDocs.map((d) => `\`${d}\` (Verified ✅)`).join(', ')
      : '_None_';

  const missingDocsStr =
    missingDocs.length > 0
      ? missingDocs.map((d) => `\`${d}\` (Missing ❌)`).join(', ')
      : '_None_';

  const answer = `Based on your request, I have retrieved the compliance regulations for **${targetCountry}** (regulated by the **${rules.regulatoryBody}**) and audited it against your active Compliance Passport.

### 🌐 Compliance Matching Analysis
* **Target Country:** ${targetCountry}
* **Regulatory Authority:** ${rules.regulatoryBody}
* **General Requirement:** ${rules.description}
* **Estimated Compliance Readiness:** **${estimatedScore}%**

### 📑 Document Verification Audit
* **Already Verified Documents:** ${availableDocsStr}
* **Missing Documents Needed:** ${missingDocsStr}

### 🚀 Recommended Next Steps for ${targetCountry} Expansion
${nextSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

*The estimated time to clear compliance audits for ${targetCountry} expansion is approximately **${rules.estimatedTimeline}** after submitting all documents.*`;

  return {
    answer,
    country: targetCountry,
    availableDocs,
    missingDocs,
    estimatedScore,
    nextSteps,
  };
}

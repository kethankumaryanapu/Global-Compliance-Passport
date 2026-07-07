import { db } from './db';

export interface ValidationReport {
  status: 'VALIDATED' | 'FAILED' | 'REVIEW_REQUIRED';
  score: number;
  errors: string[];
  warnings: string[];
  validatedFields: string[];
  missingFields: string[];
}

// Token-based Jaccard similarity index for checking text consistency
function getJaccardSimilarity(str1: string, str2: string): number {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

  const set1 = new Set(clean(str1));
  const set2 = new Set(clean(str2));

  if (set1.size === 0 && set2.size === 0) return 1.0;
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

export async function runUniversalValidation(
  docId: string,
  type: string,
  ocrFields: Record<string, any>,
  confidence: number,
  companyId: string
): Promise<ValidationReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validatedFields: string[] = [];
  const missingFields: string[] = [];
  
  let score = 100;

  // 1. OCR Confidence check
  if (confidence < 75) {
    warnings.push(`Low OCR text extraction confidence (${confidence}%). Please verify fields manually.`);
    score -= 10;
  }

  // 2. Unreadable or unrecognized document
  const values = Object.values(ocrFields).filter(v => v !== null && v !== undefined && String(v).trim().length > 0);
  const totalLength = values.reduce((sum, v) => sum + String(v).length, 0);
  if (totalLength < 30) {
    errors.push("Document text is unreadable or unrecognized. Please upload a clear document.");
    return {
      status: 'FAILED',
      score: 10,
      errors,
      warnings,
      validatedFields,
      missingFields,
    };
  }

  // Load active company profile
  const company = await db.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    errors.push("Associated company profile details not found.");
    return {
      status: 'FAILED',
      score: 0,
      errors,
      warnings,
      validatedFields,
      missingFields,
    };
  }

  // 3. Document type matching & required field checks
  const checkRequired = (reqs: string[]) => {
    for (const req of reqs) {
      if (!ocrFields[req] || String(ocrFields[req]).trim().length === 0) {
        missingFields.push(req);
        errors.push(`Missing required document field: ${req}`);
        score -= 15;
      } else {
        validatedFields.push(req);
      }
    }
  };

  if (type === 'PAN') {
    checkRequired(['pan', 'name', 'dateOfIncorporation']);
  } else if (type === 'GST') {
    checkRequired(['gstin', 'legalName', 'constitutionOfBusiness']);
  } else if (type === 'INCORPORATION') {
    checkRequired(['cin', 'companyName', 'dateOfIncorporation', 'registeredAddress']);
  } else if (type === 'FSSAI') {
    checkRequired(['licenseNumber', 'establishmentName']);
  } else if (type === 'PASSPORT') {
    checkRequired(['passportNumber', 'holderName', 'nationality']);
  } else if (type === 'BANK_PROOF') {
    checkRequired(['bankName', 'accountNumber', 'ifscCode']);
  } else {
    // Universal fallback: require at least name and identification field
    const keys = Object.keys(ocrFields);
    const hasIdentifier = keys.some(k => k.toLowerCase().includes('id') || k.toLowerCase().includes('number'));
    if (!hasIdentifier) {
      warnings.push("No registration identifier or license number detected in document.");
      score -= 10;
    }
  }

  // 4. Duplicate Check
  const checkIdentifier = ocrFields.gstin || ocrFields.pan || ocrFields.cin || ocrFields.licenseNumber || ocrFields.passportNumber || ocrFields.taxpayerId;
  if (checkIdentifier) {
    const duplicateDoc = await db.document.findFirst({
      where: {
        id: { not: docId },
        status: { in: ['VERIFIED', 'AI_VALIDATED', 'Verified'] },
        ocrData: {
          contains: String(checkIdentifier),
        },
      },
    });
    if (duplicateDoc) {
      errors.push(`Duplicate document check failed: Identification key '${checkIdentifier}' is already registered.`);
      score -= 30;
    }
  }

  // 5. Registration Number format checks
  if (ocrFields.pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(String(ocrFields.pan).trim().toUpperCase())) {
      errors.push(`Invalid Permanent Account Number (PAN) format: ${ocrFields.pan}`);
      score -= 20;
    }
  }
  if (ocrFields.gstin) {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(String(ocrFields.gstin).trim().toUpperCase())) {
      errors.push(`Invalid Goods and Services Tax Identification Number (GSTIN) format: ${ocrFields.gstin}`);
      score -= 20;
    }
  }
  if (ocrFields.cin) {
    const cinRegex = /^[L|U][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
    if (!cinRegex.test(String(ocrFields.cin).trim().toUpperCase())) {
      errors.push(`Invalid Corporate Identification Number (CIN) format: ${ocrFields.cin}`);
      score -= 20;
    }
  }

  // 6. Dates checks (Expiry / Future dates)
  const today = new Date();
  
  // Future dates (Issue / Incorporation cannot be in the future)
  const incDateStr = ocrFields.dateOfIncorporation || ocrFields.dateOfLiability;
  if (incDateStr) {
    const incDate = new Date(incDateStr);
    if (!isNaN(incDate.getTime()) && incDate > today) {
      errors.push(`Invalid future date detected: Issue date '${incDateStr}' cannot be in the future.`);
      score -= 20;
    }
  }

  // Expiry check
  const expDateStr = ocrFields.expiryDate || ocrFields.expirationDate;
  if (expDateStr) {
    const expDate = new Date(expDateStr);
    if (!isNaN(expDate.getTime())) {
      if (expDate < today) {
        errors.push(`Document check failed: Document has expired on ${expDate.toLocaleDateString()}.`);
        score -= 25;
      } else {
        const diffTime = Math.abs(expDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          warnings.push(`Document is expiring soon in ${diffDays} days.`);
        }
      }
    }
  }

  // 7. Profile consistency checks (Jaccard token matches)
  const extractedName = ocrFields.legalName || ocrFields.companyName || ocrFields.name || ocrFields.establishmentName;
  if (extractedName && company.name) {
    const similarity = getJaccardSimilarity(String(extractedName), company.name);
    if (similarity < 0.6) {
      warnings.push(`Company name mismatch: Document name '${extractedName}' has low similarity with profile name '${company.name}'.`);
      score -= 15;
    } else {
      validatedFields.push('companyNameConsistency');
    }
  }

  const extractedAddress = ocrFields.registeredAddress || ocrFields.address;
  if (extractedAddress && company.address) {
    const similarity = getJaccardSimilarity(String(extractedAddress), company.address);
    if (similarity < 0.4) {
      warnings.push(`Registered address consistency check warning: Address on document does not closely match company profile.`);
      score -= 10;
    } else {
      validatedFields.push('addressConsistency');
    }
  }

  // Determine final status
  let status: 'VALIDATED' | 'FAILED' | 'REVIEW_REQUIRED' = 'VALIDATED';
  if (errors.length > 0) {
    status = 'FAILED';
  } else if (warnings.length > 0 || score < 85) {
    status = 'REVIEW_REQUIRED';
  }

  if (score < 0) score = 0;

  return {
    status,
    score,
    errors,
    warnings,
    validatedFields,
    missingFields,
  };
}

export interface VerificationFlowReport {
  documentType: string;
  expectedType: string;
  status: 'VERIFIED' | 'LOW_CONFIDENCE' | 'VERIFICATION_FAILED';
  confidence: number;
  reason: string;
  checks: {
    ocr: boolean;
    documentClassification: boolean;
    requiredFields: boolean;
    expiry: boolean;
    duplicate: boolean;
  };
}

export function getExpectedCategoryName(dbType: string): string {
  switch (dbType) {
    case 'KYC': return 'Director KYC';
    case 'FSSAI': return 'FSSAI License';
    case 'GST': return 'GST Certificate';
    case 'INCORPORATION': return 'Certificate of Incorporation';
    case 'PAN': return 'PAN Card';
    case 'TAX_CERTIFICATE': return 'Tax Certificate';
    case 'BUSINESS_LICENSE': return 'Business License';
    case 'FINANCIALS': return 'Financial Statement';
    case 'BANK_PROOF': return 'Bank Statement';
    case 'PASSPORT': return 'Passport';
    case 'OTHER': return 'Other';
    default: return dbType;
  }
}

export function getAcceptedDocTypes(expectedCategory: string): string[] {
  switch (expectedCategory) {
    case 'Director KYC':
      return ['DIR-3 KYC Form', 'Aadhaar Card', 'PAN Card', 'Passport', 'Driving Licence', 'Voter ID'];
    case 'FSSAI License':
      return ['FSSAI License'];
    case 'GST Certificate':
      return ['GST Certificate'];
    case 'Certificate of Incorporation':
      return ['Certificate of Incorporation (CIN)', 'Certificate of Incorporation'];
    case 'PAN Card':
      return ['PAN Card'];
    case 'Tax Certificate':
      return ['Tax Certificate'];
    case 'Business License':
      return ['Business License'];
    case 'Financial Statement':
      return ['Financial Statement'];
    case 'Bank Statement':
      return ['Bank Statement'];
    case 'Passport':
      return ['Passport'];
    case 'Other':
      return [
        'Aadhaar Card', 'PAN Card', 'Passport', 'Driving Licence', 'Voter ID',
        'DIR-3 KYC Form', 'GST Certificate', 'Certificate of Incorporation (CIN)',
        'FSSAI License', 'Business License', 'Financial Statement', 'Bank Statement',
        'Tax Certificate', 'Other'
      ];
    default:
      return [expectedCategory];
  }
}

export async function runDocumentVerificationFlow(
  docId: string,
  appType: string,
  detectedType: string,
  ocrFields: Record<string, any>,
  ocrText: string,
  confidence: number,
  companyId: string
): Promise<VerificationFlowReport> {
  const expectedCategory = getExpectedCategoryName(appType);
  const acceptedTypes = getAcceptedDocTypes(expectedCategory);
  
  // OCR Readability Check
  const ocrCheck = ocrText.trim().length >= 30;
  
  // Check if detected type matches the expected category
  const classificationMatch = acceptedTypes.some(
    type => type.toLowerCase() === detectedType.toLowerCase()
  );

  if (!classificationMatch) {
    return {
      documentType: detectedType,
      expectedType: expectedCategory,
      status: 'VERIFICATION_FAILED',
      confidence: 0,
      reason: 'Wrong document type uploaded.',
      checks: {
        ocr: ocrCheck,
        documentClassification: false,
        requiredFields: false,
        expiry: false,
        duplicate: false
      }
    };
  }

  // Perform full validation checks
  let documentClassificationCheck = true;
  let requiredFieldsCheck = true;
  let expiryCheck = true;
  let duplicateCheck = false;
  let confidenceScore = 100;

  // 1. OCR Readability
  if (!ocrCheck) {
    confidenceScore -= 40;
  }

  // 2. Image Quality (OCR confidence < 75)
  if (confidence < 75) {
    confidenceScore -= 15;
  }

  // 3. Expiry Check
  const today = new Date();
  const expDateStr = ocrFields.expiryDate || ocrFields.expiry || ocrFields.expirationDate;
  if (expDateStr) {
    const expDate = new Date(expDateStr);
    if (!isNaN(expDate.getTime()) && expDate < today) {
      expiryCheck = false;
      confidenceScore -= 30;
    }
  }

  // 4. Duplicate Check
  const checkIdentifier = ocrFields.gstin || ocrFields.pan || ocrFields.cin || ocrFields.licenseNumber || ocrFields.passportNumber || ocrFields.taxpayerId || ocrFields.uidai || ocrFields.aadhaar || ocrFields.voterId;
  if (checkIdentifier) {
    const duplicateDoc = await db.document.findFirst({
      where: {
        id: { not: docId },
        status: { in: ['VERIFIED', 'AI_VALIDATED', 'Verified'] },
        ocrData: {
          contains: String(checkIdentifier),
        },
      },
    });
    if (duplicateDoc) {
      duplicateCheck = true;
      confidenceScore -= 45;
    }
  }

  // 5. Required Fields & Missing Mandatory Fields Check
  let missingFieldsCount = 0;
  if (detectedType === 'PAN Card') {
    if (!ocrFields.pan) missingFieldsCount++;
    if (!ocrFields.name && !ocrFields.holderName) missingFieldsCount++;
  } else if (detectedType === 'DIR-3 KYC Form' || detectedType === 'Director KYC') {
    if (!ocrFields.pan && !ocrFields.din) missingFieldsCount++;
    if (!ocrFields.name && !ocrFields.holderName) missingFieldsCount++;
  } else if (detectedType === 'GST Certificate') {
    if (!ocrFields.gstin) missingFieldsCount++;
    if (!ocrFields.legalName && !ocrFields.companyName) missingFieldsCount++;
  } else if (detectedType === 'Certificate of Incorporation (CIN)' || detectedType === 'Certificate of Incorporation') {
    if (!ocrFields.cin) missingFieldsCount++;
    if (!ocrFields.companyName) missingFieldsCount++;
  } else if (detectedType === 'FSSAI License') {
    if (!ocrFields.licenseNumber) missingFieldsCount++;
    if (!ocrFields.establishmentName && !ocrFields.name) missingFieldsCount++;
  } else if (detectedType === 'Passport') {
    if (!ocrFields.passportNumber) missingFieldsCount++;
    if (!ocrFields.holderName) missingFieldsCount++;
  } else if (detectedType === 'Aadhaar Card') {
    if (!ocrFields.aadhaar && !ocrFields.uidai) missingFieldsCount++;
    if (!ocrFields.name && !ocrFields.holderName) missingFieldsCount++;
  } else if (detectedType === 'Driving Licence' || detectedType === 'Driving License') {
    if (!ocrFields.licenseNumber) missingFieldsCount++;
    if (!ocrFields.name && !ocrFields.holderName) missingFieldsCount++;
  } else if (detectedType === 'Voter ID') {
    if (!ocrFields.voterId) missingFieldsCount++;
    if (!ocrFields.name && !ocrFields.holderName) missingFieldsCount++;
  } else if (detectedType === 'Bank Statement') {
    if (!ocrFields.bankName && !ocrFields.accountNumber) missingFieldsCount++;
  } else if (detectedType === 'Other') {
    const keys = Object.keys(ocrFields);
    const hasIdentifier = keys.some(k => k.toLowerCase().includes('id') || k.toLowerCase().includes('number') || k.toLowerCase().includes('pan') || k.toLowerCase().includes('gstin') || k.toLowerCase().includes('cin'));
    if (!hasIdentifier) {
      missingFieldsCount++;
    }
  }

  if (missingFieldsCount > 0) {
    requiredFieldsCheck = false;
    confidenceScore -= (missingFieldsCount * 45);
  }

  // Boundary checks for confidence score
  if (confidenceScore < 0) confidenceScore = 0;
  if (confidenceScore > 100) confidenceScore = 100;

  // Determine final status
  let status: 'VERIFIED' | 'LOW_CONFIDENCE' | 'VERIFICATION_FAILED' = 'VERIFIED';
  let reason = 'Document successfully verified.';

  if (confidenceScore < 60 || !expiryCheck || duplicateCheck) {
    status = 'VERIFICATION_FAILED';
    reason = duplicateCheck 
      ? 'Duplicate document check failed: Identification key already registered.'
      : !expiryCheck 
        ? 'Document check failed: Document has expired.' 
        : 'Verification failed.';
  } else if (confidenceScore < 80) {
    status = 'LOW_CONFIDENCE';
    reason = 'Please upload a clearer copy.';
  }

  return {
    documentType: detectedType,
    expectedType: expectedCategory,
    status,
    confidence: confidenceScore,
    reason,
    checks: {
      ocr: ocrCheck,
      documentClassification: documentClassificationCheck,
      requiredFields: requiredFieldsCheck,
      expiry: expiryCheck,
      duplicate: duplicateCheck
    }
  };
}

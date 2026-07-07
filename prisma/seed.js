const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const countriesData = [
  {
    country: "India",
    rules: JSON.stringify({
      requiredDocuments: ["GST", "PAN", "INCORPORATION", "TAX_CERTIFICATE"],
      regulatoryBody: "Ministry of Corporate Affairs (MCA) & GST Council",
      description: "Indian business compliance requires structural incorporation documents and tax identification.",
      guidelines: {
        GST: "Goods and Services Tax identification number (GSTIN) is 15 characters long.",
        PAN: "Permanent Account Number (PAN) is a 10-digit alphanumeric identifier.",
        INCORPORATION: "Certificate of Incorporation (CoI) issued by ROC with a valid Corporate Identity Number (CIN).",
        TAX_CERTIFICATE: "Income Tax registration certificate or recent tax returns."
      },
      estimatedTimeline: "10-15 business days"
    })
  },
  {
    country: "USA",
    rules: JSON.stringify({
      requiredDocuments: ["BUSINESS_LICENSE", "TAX_CERTIFICATE", "DIRECTOR_KYC", "BANK_PROOF"],
      regulatoryBody: "Internal Revenue Service (IRS) & State Secretary of State",
      description: "US business compliance requires federal EIN registration and state level business authorization.",
      guidelines: {
        BUSINESS_LICENSE: "State level filing certificate or operating business license.",
        TAX_CERTIFICATE: "IRS Employer Identification Number (EIN) confirmation letter (Form CP-575).",
        DIRECTOR_KYC: "Government-issued ID (Passport/SSN details) of primary company directors.",
        BANK_PROOF: "Recent bank statement under the exact registered company name."
      },
      estimatedTimeline: "5-10 business days"
    })
  },
  {
    country: "Germany",
    rules: JSON.stringify({
      requiredDocuments: ["INCORPORATION", "BUSINESS_LICENSE", "TAX_CERTIFICATE"],
      regulatoryBody: "Handelsregister (Commercial Register) & Finanzamt",
      description: "German compliance requires registration in the commercial register and local tax authorities.",
      guidelines: {
        INCORPORATION: "Handelsregisterauszug (Commercial Register Extract) showing local court registration.",
        BUSINESS_LICENSE: "Gewerbeanmeldung (Trade Registration) document from the local municipality.",
        TAX_CERTIFICATE: "Steuernummer (local tax number) and Umsatzsteuer-Identifikationsnummer (VAT ID)."
      },
      estimatedTimeline: "15-20 business days"
    })
  },
  {
    country: "Singapore",
    rules: JSON.stringify({
      requiredDocuments: ["INCORPORATION", "TAX_CERTIFICATE", "DIRECTOR_KYC", "PASSPORT"],
      regulatoryBody: "Accounting and Corporate Regulatory Authority (ACRA)",
      description: "Singapore compliance requires dynamic ACRA BizFile updates and foreign director passport checks.",
      guidelines: {
        INCORPORATION: "ACRA Business Profile (BizFile) showing registered details and UEN.",
        TAX_CERTIFICATE: "Corporate tax reference certificate issued by IRAS.",
        DIRECTOR_KYC: "Identification and KYC proofs of directors (NRIC for locals, Employment Pass/Passport for foreigners).",
        PASSPORT: "Valid passport copies of primary shareholders and directors."
      },
      estimatedTimeline: "3-5 business days"
    })
  },
  {
    country: "UAE",
    rules: JSON.stringify({
      requiredDocuments: ["BUSINESS_LICENSE", "TAX_CERTIFICATE", "DIRECTOR_KYC", "PASSPORT"],
      regulatoryBody: "Department of Economic Development (DED) or Freezone Authority",
      description: "UAE compliance requires trade license verification and Federal Tax Authority (FTA) details.",
      guidelines: {
        BUSINESS_LICENSE: "Trade License / Commercial License from DED or Freezone (e.g. DMCC, ADGM, DIFC).",
        TAX_CERTIFICATE: "Federal Tax Authority (FTA) VAT Registration Certificate.",
        DIRECTOR_KYC: "Emirates ID (for residents) or passport verification for global founders.",
        PASSPORT: "Clear scan of the main passport pages for all active managers."
      },
      estimatedTimeline: "7-12 business days"
    })
  }
];

const mockStartups = [
  {
    email: 'acme@startup.com',
    name: 'Acme Tech Solutions',
    companyName: 'Acme Technologies Private Limited',
    regNumber: 'U72900MH2024PTC111111',
    address: '402, Innovator Tower, HSR Layout, Bangalore - 560102',
    score: 80,
    industry: 'SaaS / AI Tools',
    country: 'India',
    docs: [
      { name: 'Acme_Incorporation_Certificate.pdf', type: 'INCORPORATION', status: 'VERIFIED', ocr: { cin: 'U72900MH2024PTC111111', companyName: 'Acme Technologies Private Limited' } },
      { name: 'Acme_PAN_Card.pdf', type: 'PAN', status: 'VERIFIED', ocr: { pan: 'ABCDE1111F', name: 'Acme Technologies' } },
      { name: 'Acme_GST_Registration.pdf', type: 'GST', status: 'VERIFIED', ocr: { gstin: '29AAAAA1111A1Z1', legalName: 'Acme Technologies' } },
      { name: 'Director_Passport_Scan.pdf', type: 'PASSPORT', status: 'UPLOADED', ocr: { passportNumber: 'Z1111111', holderName: 'Alice Miller' } }
    ]
  },
  {
    email: 'greenfood@startup.com',
    name: 'Green Food Services',
    companyName: 'Green Foods India Private Limited',
    regNumber: 'U15130DL2023PTC222222',
    address: '12, Connaught Place, New Delhi - 110001',
    score: 100,
    industry: 'FoodTech / E-Commerce',
    country: 'Singapore',
    docs: [
      { name: 'Green_COI.pdf', type: 'INCORPORATION', status: 'VERIFIED', ocr: { cin: 'U15130DL2023PTC222222', companyName: 'Green Foods India Private Limited' } },
      { name: 'Green_PAN.pdf', type: 'PAN', status: 'VERIFIED', ocr: { pan: 'ABCDE2222F', name: 'Green Foods India' } },
      { name: 'Green_GST.pdf', type: 'GST', status: 'VERIFIED', ocr: { gstin: '07AAAAA2222A1Z2', legalName: 'Green Foods India' } },
      { name: 'FSSAI_License.pdf', type: 'FSSAI', status: 'VERIFIED', ocr: { licenseNumber: '10023000000000', establishmentName: 'Green Food Services' } }
    ]
  },
  {
    email: 'paypulse@startup.com',
    name: 'PayPulse Fintech',
    companyName: 'PayPulse Digital Technologies Inc.',
    regNumber: 'EIN-333333333',
    address: 'Suite 800, Delaware Tech Hub, Wilmington, DE 19801',
    score: 35,
    industry: 'Fintech / Payments',
    country: 'USA',
    docs: [
      { name: 'PayPulse_EIN_Letter.pdf', type: 'TAX_CERTIFICATE', status: 'VERIFIED', ocr: { taxpayerId: 'TX-3333-EIN', authority: 'IRS' } },
      { name: 'Delaware_State_License.pdf', type: 'BUSINESS_LICENSE', status: 'UPLOADED', ocr: { licenseNumber: 'LIC-3333-B', businessType: 'Fintech' } },
      { name: 'Audit_Statement_2025.pdf', type: 'FINANCIALS', status: 'REJECTED', ocr: { auditYear: '2025', auditorName: 'Unknown' } }
    ]
  },
  {
    email: 'nexarobot@startup.com',
    name: 'Nexa Robotics',
    companyName: 'Nexa Systems Singapore Pte. Ltd.',
    regNumber: 'UEN-44444444A',
    address: '10 Collyer Quay, Ocean Financial Centre, Singapore - 049315',
    score: 0,
    industry: 'Robotics / Automation',
    country: 'Singapore',
    docs: [
      { name: 'ACRA_Profile_Nexa.pdf', type: 'INCORPORATION', status: 'PROCESSING', ocr: { cin: 'UEN-44444444A', companyName: 'Nexa Systems Singapore' } }
    ]
  }
];

const mockInstitutions = [
  { email: 'icici@bank.com', name: 'ICICI Bank', desc: 'Leading private sector bank offering corporate and retail banking services.' },
  { email: 'hdfc@bank.com', name: 'HDFC Bank', desc: 'Premium financial institution providing commercial banking, loans, and treasury services.' },
  { email: 'sbi@bank.com', name: 'State Bank of India', desc: 'Largest public sector bank supporting enterprises with scale and credit lines.' },
  { email: 'axis@bank.com', name: 'Axis Bank', desc: 'Major commercial banking and corporate financing solutions.' },
  { email: 'razorpay@gateway.com', name: 'Razorpay', desc: 'Leading payment gateway for startups providing merchant onboarding and cashflow management.' },
  { email: 'stripe@gateway.com', name: 'Stripe', desc: 'Global payment infrastructure for internet businesses and startups.' },
  { email: 'sequoia@vc.com', name: 'Sequoia Capital', desc: 'Premier venture capital firm investing in technology, financial services, and healthcare.' },
  { email: 'yc@vc.com', name: 'Y Combinator', desc: 'Startup accelerator providing early investment, mentorship, and fundraising networks.' },
  { email: 'portal@gov.in', name: 'Government Portal', desc: 'Official digital gateway for regulatory compliance review and business grant applications.' }
];

async function main() {
  console.log('Clearing database tables...');
  await prisma.verification.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.compliancePassport.deleteMany({});
  await prisma.request.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.institution.deleteMany({});
  await prisma.countryComplianceRules.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding compliance rules...');
  for (const item of countriesData) {
    await prisma.countryComplianceRules.create({
      data: {
        country: item.country,
        rules: item.rules,
      },
    });
  }

  const hash = await bcrypt.hash('admin123', 10);
  console.log('Seeding mock admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@123',
      name: 'System Admin',
      passwordHash: hash,
      role: 'ADMIN',
    },
  });

  console.log('Seeding mock startups & compliance histories...');
  const startupPass = await bcrypt.hash('startup123', 10);
  
  for (const st of mockStartups) {
    const user = await prisma.user.create({
      data: {
        email: st.email,
        name: st.name,
        passwordHash: startupPass,
        role: 'STARTUP',
      },
    });

    const company = await prisma.company.create({
      data: {
        name: st.companyName,
        regNumber: st.regNumber,
        complianceScore: st.score,
        address: st.address,
        industry: st.industry,
        country: st.country,
        userId: user.id,
      },
    });

    // Write documents
    const docRecords = [];
    for (const doc of st.docs) {
      const dbDoc = await prisma.document.create({
        data: {
          name: doc.name,
          type: doc.type,
          url: `/uploads/${doc.name}`,
          status: doc.status,
          ocrData: JSON.stringify(doc.ocr),
          companyId: company.id,
          expiryDate: doc.status === 'VERIFIED' ? new Date(new Date().getFullYear() + 2, 5, 30) : null,
          comments: `${doc.type} parsed with high confidence. No duplicate tags.`,
        },
      });

      docRecords.push(dbDoc);

      // Create Verification entry
      await prisma.verification.create({
        data: {
          documentId: dbDoc.id,
          status: doc.status === 'VERIFIED' ? 'VERIFIED' : doc.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
          adminId: doc.status === 'VERIFIED' ? admin.id : 'SYSTEM_AI',
          comments: doc.status === 'VERIFIED' ? 'Verified against official registries.' : 'Awaiting review.',
        },
      });
    }

    // Passport
    await prisma.compliancePassport.create({
      data: {
        passportId: `GCP-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        companyId: company.id,
        complianceScore: st.score,
        status: st.score >= 80 ? 'TRUSTED' : 'UNTRUSTED',
        qrCode: 'SVG_QR_MOCK_DATA',
        digitalSignature: `SHA256:VERIFIED_MOCK_${company.id.slice(0, 5)}`,
        expiresAt: new Date(new Date().getFullYear() + 1, 0, 1),
      },
    });

    // Seed historical audit logs
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        action: 'UPLOAD',
        details: `Initial startup registration and upload of ${st.docs.length} compliance documents completed.`,
      },
    });
  }

  console.log('Seeding mock institutions...');
  const instPass = await bcrypt.hash('institution123', 10);
  const companiesList = await prisma.company.findMany();

  for (const inst of mockInstitutions) {
    const user = await prisma.user.create({
      data: {
        email: inst.email,
        name: inst.name,
        passwordHash: instPass,
        role: 'INSTITUTION',
      },
    });

    const dbInst = await prisma.institution.create({
      data: {
        name: inst.name,
        description: inst.desc,
        userId: user.id,
      },
    });

    // Create a mock document request
    if (companiesList.length > 0) {
      const targetCompany = companiesList[0];
      await prisma.request.create({
        data: {
          institutionId: dbInst.id,
          companyId: targetCompany.id,
          documentTypes: JSON.stringify(['GST', 'PAN']),
          status: 'PENDING',
          sharedDocuments: '[]',
        },
      });
    }
  }

  console.log('Seeding complete successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

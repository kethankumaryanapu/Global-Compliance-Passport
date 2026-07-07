'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ThreeDBackground from '@/components/ThreeDBackground';
import { Bot } from "lucide-react";
import {
  Shield,
  Upload,
  Search,
  CheckCircle,
  HelpCircle,
  Building,
  Key,
  Globe2,
  Lock,
  ArrowRight,
  Database,
  RefreshCw,
  Clock,
  Sparkles,
  Play
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is Global Compliance Passport (GCP)?",
      a: "GCP is a reusable trusted digital compliance identity platform for businesses. Rather than uploading incorporation certificates, tax proofs, and KYC documents separately to every bank, investor, and payment gateway, you verify them once with a trusted authority and share your pre-verified credentials securely."
    },
    {
      q: "Is this just another document storage system like Google Drive or DigiLocker?",
      a: "No. GCP goes beyond storage. It parses your files using AI OCR, flags gaps, structures registry numbers, maps compliance requirements for global expansion (e.g. Germany or USA via RAG Advisor), and maintains a cryptographic consent-sharing ledger that allows you to grant, expiry, or revoke institutional access instantly."
    },
    {
      q: "How does the AI Document Processing work?",
      a: "When you upload certificates (GST, PAN, incorporation filings), our AI engine runs high-fidelity OCR to extract registry IDs, legal names, and expiration dates. It cross-checks for duplicates, flags missing fields, and calculates an audit-readiness confidence score before presenting it to the verification queue."
    },
    {
      q: "Who performs the legal verification of documents?",
      a: "AI does not legally verify documents. For our MVP, verification is conducted by a mock Trusted Compliance Authority admin queue. Once the admin approves the details, your digital Compliance Passport is signed, turning its status to 'TRUSTED'."
    },
    {
      q: "How secure is the document sharing mechanism?",
      a: "Startups retain 100% ownership of their data. When an institution requests access, you choose whether to Approve, Reject, or Partial Share (e.g., share PAN but hide financial statements). You also set expiration dates on shared links and can revoke access anytime, immediately erasing their credential view rights."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col radial-glow">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-container relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 min-h-[92vh] flex items-center">
        {/* Background Image with Hover Zoom */}
        <div 
          className="hero-bg-wrapper bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        {/* Color Overlays to maintain contrast */}
        <div className="absolute inset-0 bg-slate-950/20 dark:block hidden z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-white/20 dark:hidden block z-0 pointer-events-none" />
        
        {/* 3D Background */}
        <ThreeDBackground />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10 -mt-12 lg:-mt-16">

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white drop-shadow-md">
            Global Compliance{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-primary to-purple-600 dark:from-indigo-400 dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
              Passport
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-700 dark:text-slate-100 font-semibold leading-relaxed drop-shadow-sm">
            A unified digital compliance identity for startups and businesses to build trust and unlock global opportunities. Upload once, verify through a trusted authority, and share instantly.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 h-12 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-2xl transition-all shadow-lg shadow-primary/25"
            >
              Create Your Passport
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-6 h-12 text-sm font-bold border border-border/80 bg-card/60 hover:bg-card/90 rounded-2xl transition-all text-slate-800 dark:text-slate-200"
            >
              <Play className="mr-2 h-4 w-4 fill-slate-800 dark:fill-slate-200 text-slate-800 dark:text-slate-200" />
              Working
            </a>
          </div>
        </div>
      </section>




      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-xs font-bold text-primary tracking-widest uppercase">The Lifecycle</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">How It Works</p>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            GCP bridges the verification gap between startups and institutions in 4 simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-card/30 border border-border/40 p-6 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
              1
            </div>
            <h3 className="text-sm font-bold text-foreground">Upload Documents</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload incorporation files, GST registration proofs, tax certificates, and KYC scans into your secure dashboard.
            </p>
          </div>

          <div className="bg-card/30 border border-border/40 p-6 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
              2
            </div>
            <h3 className="text-sm font-bold text-foreground">AI OCR Extraction</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our AI automatically triggers OCR to extract registry IDs, calculate audit readiness, and detect duplicates.
            </p>
          </div>

          <div className="bg-card/30 border border-border/40 p-6 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-lg">
              3
            </div>
            <h3 className="text-sm font-bold text-foreground">Trusted Verification</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Trusted compliance authorities inspect the extracted details and sign your reusable Compliance Passport.
            </p>
          </div>

          <div className="bg-card/30 border border-border/40 p-6 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
              4
            </div>
            <h3 className="text-sm font-bold text-foreground">Secure Sharing</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Banks and investors request document access. You grant permission on a timer and revoke consent anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-slate-100/40 dark:bg-black/20 border-y border-border/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-bold text-primary tracking-widest uppercase">Features</h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">Built for Institutional Trust</p>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Everything you need to handle corporate compliance at scale without repeated friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feat 1 */}
            <div className="bg-card/40 border border-border/40 p-6 rounded-3xl space-y-3">
              <Upload className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-sm font-bold">Smart Drag & Drop</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Seamless uploads for GST, PAN, ACRA Bizfile, EIN, and general PDFs with immediate processing feedback.
              </p>
            </div>
            {/* Feat 2 */}
            <div className="bg-card/40 border border-border/40 p-6 rounded-3xl space-y-3">
              <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-bold">Instant AI OCR Text parsing</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Intelligently extracts corporate names, registration IDs, tax scopes, and expiration details with confidence ratings.
              </p>
            </div>
            {/* Feat 3 */}
            <div className="bg-card/40 border border-border/40 p-6 rounded-3xl space-y-3">
              <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-bold">Digital Reusable Passport</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generates a secure verification card containing cryptographic signatures, trusted badges, and verification logs.
              </p>
            </div>
            {/* Feat 4 */}
            <div className="bg-card/40 border border-border/40 p-6 rounded-3xl space-y-3">
              <Key className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h4 className="text-sm font-bold">Dynamic Consent Management</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Startups authorize access on a calendar timer, approve partial requests, and revoke access instantly.
              </p>
            </div>
            {/* Feat 5 */}
            <div className="bg-card/40 border border-border/40 p-6 rounded-3xl space-y-3">
              <Bot className="h-6 w-6 text-indigo-600 dark:text-amber-400" />
              <h4 className="text-sm font-bold">AI Compliance Advisor (RAG)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Query advisor regarding USA, Germany, UAE expansion. RAG matches documents against local laws.
              </p>
            </div>
            {/* Feat 6 */}
            <div className="bg-card/40 border border-border/40 p-6 rounded-3xl space-y-3">
              <Globe2 className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              <h4 className="text-sm font-bold">Multi-Role Support</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Custom portals optimized for Startups (management), Institutions (verifying), and Admins (authorizing).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Ledger diagram */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-xs font-bold text-primary tracking-widest uppercase">System Topology</h2>
          <p className="text-3xl font-extrabold tracking-tight">The Trust Infrastructure</p>
        </div>

        <div className="bg-card/30 border border-border/40 rounded-3xl p-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-4 max-w-sm">
              <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs font-bold text-primary inline-block">
                Security Ledger Architecture
              </div>
              <h4 className="text-xl font-bold">One Upload. Endless Verifications.</h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                The compliance passport acts as an intermediary credential layer. Institutions verify the authenticity of the passport's digital signature and issue date, bypassing the need to store raw document scans.
              </p>
            </div>

            {/* Architecture Concept Mock (SVG / CSS) */}
            <div className="flex-1 w-full max-w-md bg-zinc-950/80 rounded-2xl border border-border/50 p-6 space-y-4 text-xs font-mono">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 border-b border-border pb-2">
                <span>VERIFICATION FLOW</span>
                <span>STATUS: SECURED</span>
              </div>

              <div className="flex justify-between items-center bg-zinc-900/60 p-2.5 rounded-lg border border-border/30">
                <span className="text-indigo-400 flex items-center"><Building className="h-3.5 w-3.5 mr-1.5" /> Startup Files</span>
                <span className="text-zinc-500">PDF Scans</span>
              </div>

              <div className="flex justify-center text-zinc-600">
                <ArrowRight className="h-4 w-4 transform rotate-90" />
              </div>

              <div className="flex justify-between items-center bg-zinc-900/60 p-2.5 rounded-lg border border-border/30">
                <span className="text-primary flex items-center"><Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Extract + OCR</span>
                <span className="text-emerald-400">Confidence 96%</span>
              </div>

              <div className="flex justify-center text-zinc-600">
                <ArrowRight className="h-4 w-4 transform rotate-90" />
              </div>

              <div className="flex justify-between items-center bg-zinc-900/60 p-2.5 rounded-lg border border-primary/30">
                <span className="text-emerald-400 flex items-center"><Shield className="h-3.5 w-3.5 mr-1.5" /> Compliance Passport</span>
                <span className="bg-primary/20 px-2 py-0.5 rounded text-[10px] text-primary-foreground font-bold">TRUSTED</span>
              </div>

              <div className="flex justify-center text-zinc-600">
                <ArrowRight className="h-4 w-4 transform rotate-90" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-900/40 p-2 rounded text-center border border-border/20 text-[10px] text-zinc-400">
                  Partner Banks
                </div>
                <div className="bg-zinc-900/40 p-2 rounded text-center border border-border/20 text-[10px] text-zinc-400">
                  VC Investors
                </div>
                <div className="bg-zinc-900/40 p-2 rounded text-center border border-border/20 text-[10px] text-zinc-400">
                  Gateways
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-slate-100/40 dark:bg-black/20 border-y border-border/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-bold text-primary tracking-widest uppercase">Value Proposal</h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">The GCP Advantage</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <Clock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-sm font-bold text-foreground">Save 90% Onboarding Time</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cut corporate account opening times down from weeks to minutes by sharing verification hashes instead of resubmitting piles of documents.
              </p>
            </div>

            <div className="space-y-3">
              <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-bold text-foreground">Complete Data Custody</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Say goodbye to documents sitting in investors' unsecured downloads folder forever. Revoke credentials access dynamically on the fly.
              </p>
            </div>

            <div className="space-y-3">
              <Globe2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-bold text-foreground">Seamless Global Expansion</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Expand across international state borders effortlessly. Our AI Advisor maps gaps instantly and tells you exactly what is missing.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-100/20 dark:bg-black/20 border-t border-border/30 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-xs font-bold text-primary tracking-widest uppercase">Knowledge Base</h2>
          <p className="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="bg-card/30 border border-border/40 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full flex justify-between items-center p-5 text-left text-sm font-bold text-foreground hover:bg-neutral-800/20 light:hover:bg-neutral-200/20"
                >
                  <span>{faq.q}</span>
                  <HelpCircle className={`h-4 w-4 text-primary shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/10">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 py-8 px-4 sm:px-6 lg:px-8 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground">Global Compliance Passport</span>
          </div>
          <p>© 2026 GCP Platforms Inc. Built for trusted corporate identities.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            <a href="#" className="hover:text-foreground">Support Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

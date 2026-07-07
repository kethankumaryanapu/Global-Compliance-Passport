'use client';

import Link from 'next/link';
import { useAuth, useTheme } from '@/context/AppContext';
import { Sun, Moon, Shield, ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return '/login';
    if (user.role === 'STARTUP') return '/startup';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/institution';
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground via-neutral-200 to-neutral-500 bg-clip-text text-transparent light:text-foreground">
                GCP
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Benefits
            </a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
          </div>

          {/* Right Action Items */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-neutral-800/40 light:hover:bg-neutral-200/50 rounded-lg transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <Link
                href={getDashboardUrl()}
                className="inline-flex items-center justify-center px-4 h-9 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
              >
                Dashboard
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-4 h-9 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-b border-border/40 px-4 pt-2 pb-4 space-y-1">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground"
          >
            How It Works
          </a>
          <a
            href="#benefits"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground"
          >
            Benefits
          </a>
          <a
            href="#testimonials"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground"
          >
            Testimonials
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground"
          >
            FAQ
          </a>
          <div className="border-t border-border/40 my-2 pt-2">
            {user ? (
              <Link
                href={getDashboardUrl()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground bg-primary rounded-lg"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

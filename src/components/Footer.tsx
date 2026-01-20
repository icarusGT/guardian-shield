// Last updated: 20th January 2025
import { Link } from 'react-router-dom';
import { Shield, GraduationCap, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg gradient-primary">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg">Guardian Shield</span>
                <span className="text-xs text-muted-foreground">by <span className="font-bold">DataShaak</span></span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Advanced fraud management system for modern businesses.
            </p>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-black p-3 rounded">
                <img 
                  src="/UniversityLogo.png" 
                  alt="United International University" 
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span>United International University</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/cases" className="hover:text-foreground transition-colors">
                  Cases
                </Link>
              </li>
              <li>
                <Link to="/transactions" className="hover:text-foreground transition-colors">
                  Transactions
                </Link>
              </li>
              <li>
                <Link to="/investigations" className="hover:text-foreground transition-colors">
                  Investigations
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Team</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/team" className="hover:text-foreground transition-colors">
                  Meet the Team
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  About DataShaak
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="https://github.com/datashaak/guardian-shield" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">University</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://www.uiu.ac.bd" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  UIU Website
                </a>
              </li>
              <li>
                <Link to="/documentation" className="hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-foreground transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} Guardian Shield by <span className="font-bold">DataShaak</span> Team. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>Developed at United International University</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


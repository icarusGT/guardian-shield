// Last updated: 20th January 2025
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Footer from '@/components/Footer';
import {
  Shield,
  Lock,
  FileText,
  ArrowLeft,
  Eye,
  Database,
  Users,
  AlertTriangle,
} from 'lucide-react';

export default function Privacy() {
  const sections = [
    {
      title: 'Information We Collect',
      icon: Database,
      content: [
        'Account information (name, email, role)',
        'Transaction data and fraud case information',
        'System usage logs and analytics',
        'Communication records with support',
        'Evidence files uploaded to cases',
      ],
    },
    {
      title: 'How We Use Your Information',
      icon: Eye,
      content: [
        'To provide and maintain our fraud detection services',
        'To process and investigate fraud cases',
        'To improve our services and develop new features',
        'To communicate with you about your account and services',
        'To ensure security and prevent unauthorized access',
      ],
    },
    {
      title: 'Data Security',
      icon: Lock,
      content: [
        'We use industry-standard encryption to protect your data',
        'Access is restricted through role-based access control',
        'All data is stored securely in compliance with industry standards',
        'Regular security audits and updates are performed',
        'We maintain comprehensive audit logs of all system activities',
      ],
    },
    {
      title: 'Data Sharing',
      icon: Users,
      content: [
        'We do not sell your personal information to third parties',
        'Data may be shared with authorized team members based on roles',
        'We may share anonymized data for research and improvement purposes',
        'Legal compliance may require sharing data with authorities when required',
        'Third-party service providers are bound by strict confidentiality agreements',
      ],
    },
    {
      title: 'Your Rights',
      icon: Shield,
      content: [
        'Right to access your personal data',
        'Right to correct inaccurate information',
        'Right to request deletion of your data',
        'Right to data portability',
        'Right to object to processing of your data',
      ],
    },
    {
      title: 'Data Retention',
      icon: FileText,
      content: [
        'We retain your data for as long as necessary to provide our services',
        'Case data is retained according to legal and regulatory requirements',
        'You may request deletion of your data subject to legal obligations',
        'Backup data may be retained for disaster recovery purposes',
        'Anonymized data may be retained for analytical purposes',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl">Guardian Shield</span>
                <span className="text-xs text-muted-foreground">by <span className="font-bold">DataShaak</span></span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button className="gradient-primary" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <section className="relative overflow-hidden py-12 sm:py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Lock className="h-5 w-5" />
              <span className="text-sm font-medium">Privacy Policy</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto text-justify">
              Your privacy is important to us. This policy explains how we collect, 
              use, and protect your information when you use Guardian Shield.
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="glass-card mb-8">
              <CardHeader>
                <CardTitle className="text-2xl mb-4">Introduction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p className="text-justify">
                  Guardian Shield by <span className="font-bold">DataShaak</span> ("we", "our", or "us") is committed to protecting 
                  your privacy. This Privacy Policy explains how we collect, use, disclose, and 
                  safeguard your information when you use our fraud detection and management 
                  system ("Service").
                </p>
                <p className="text-justify">
                  By using Guardian Shield, you agree to the collection and use of information in 
                  accordance with this policy. We will not use or share your information except 
                  as described in this Privacy Policy.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {sections.map((section, index) => (
                <Card key={index} className="glass-card">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg gradient-primary">
                        <section.icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-primary mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass-card mt-8">
              <CardHeader>
                <CardTitle className="text-2xl mb-4">Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p className="text-justify">
                  We use cookies and similar tracking technologies to track activity on our Service 
                  and hold certain information. Cookies are files with a small amount of data which 
                  may include an anonymous unique identifier.
                </p>
                <p className="text-justify">
                  You can instruct your browser to refuse all cookies or to indicate when a cookie 
                  is being sent. However, if you do not accept cookies, you may not be able to use 
                  some portions of our Service.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card mt-8">
              <CardHeader>
                <CardTitle className="text-2xl mb-4">Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p className="text-justify">
                  We may update our Privacy Policy from time to time. We will notify you of any 
                  changes by posting the new Privacy Policy on this page and updating the "Last 
                  updated" date.
                </p>
                <p className="text-justify">
                  You are advised to review this Privacy Policy periodically for any changes. 
                  Changes to this Privacy Policy are effective when they are posted on this page.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card mt-8 border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Contact Us</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-4 text-justify">
                  If you have any questions about this Privacy Policy, please contact us:
                </p>
                <ul className="space-y-2">
                  <li>Email: privacy@guardianshield.com</li>
                  <li>Support: support@guardianshield.com</li>
                  <li>
                    <Link to="/contact" className="text-primary hover:underline">
                      Contact Form
                    </Link>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}


import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  HelpCircle,
  MessageSquare,
  Mail,
  Book,
  Video,
  ArrowLeft,
  Award,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  FileText,
} from 'lucide-react';

export default function Support() {
  const supportOptions = [
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      available: true,
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours',
      available: true,
    },
    {
      icon: Book,
      title: 'Documentation',
      description: 'Browse our comprehensive documentation',
      available: true,
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      available: true,
    },
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking on "Forgot Password" on the login page. A reset link will be sent to your registered email address.',
    },
    {
      question: 'What user roles are available?',
      answer: 'Guardian Shield supports four user roles: Administrator, Investigator, Auditor, and Customer. Each role has specific permissions and access levels.',
    },
    {
      question: 'How do I create a new fraud case?',
      answer: 'Navigate to the Cases section and click "Create New Case". Fill in the required information including transaction details, evidence, and assign it to an investigator.',
    },
    {
      question: 'Can I export case data?',
      answer: 'Yes, you can export case data in various formats including CSV and PDF. Use the export option in the Cases section.',
    },
    {
      question: 'How does fraud detection work?',
      answer: 'Our system uses advanced algorithms to analyze transactions in real-time. Suspicious activities are automatically flagged based on configurable rules and machine learning models.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, Guardian Shield uses enterprise-grade security with encryption, role-based access control, and comprehensive audit logging to protect your data.',
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
                <span className="text-xs text-muted-foreground">by DataShaak</span>
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
              <HelpCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Support Center</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              How Can We Help?
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Get the help you need with Guardian Shield. Browse our resources, 
              contact support, or check out our documentation.
            </p>
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {supportOptions.map((option, index) => (
                <Card key={index} className="glass-card hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="p-3 rounded-lg gradient-primary w-fit mb-4">
                      <option.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg mb-2">{option.title}</CardTitle>
                    <CardDescription className="text-sm">{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {option.available && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Available</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-xl mb-2">Contact Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Need immediate assistance? Contact our support team.
                  </p>
                  <Button className="w-full gradient-primary" asChild>
                    <Link to="/contact">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Us
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-xl mb-2">View Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse our comprehensive documentation and guides.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/documentation">
                      <Book className="h-4 w-4 mr-2" />
                      View Docs
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-xl mb-2">Report an Issue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Found a bug or have a feature request? Let us know.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/contact">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Report Issue
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl mb-2">Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find answers to common questions about Guardian Shield
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-start gap-3 mb-2">
                        <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold mb-2">{faq.question}</h3>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} Guardian Shield by DataShaak Team. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>Developed at United International University</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


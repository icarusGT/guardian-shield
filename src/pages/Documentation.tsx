import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Book,
  FileText,
  Code,
  Users,
  Settings,
  ArrowLeft,
  Award,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

export default function Documentation() {
  const sections = [
    {
      title: 'Getting Started',
      icon: FileText,
      description: 'Learn how to set up and start using Guardian Shield',
      topics: [
        'Account Setup',
        'First Login',
        'Dashboard Overview',
        'User Roles & Permissions',
      ],
    },
    {
      title: 'User Guide',
      icon: Users,
      description: 'Comprehensive guide for all user types',
      topics: [
        'Administrator Guide',
        'Investigator Guide',
        'Auditor Guide',
        'Customer Guide',
      ],
    },
    {
      title: 'Features',
      icon: Shield,
      description: 'Detailed documentation of all features',
      topics: [
        'Fraud Detection',
        'Case Management',
        'Transaction Monitoring',
        'Investigation Workflow',
      ],
    },
    {
      title: 'API Documentation',
      icon: Code,
      description: 'Technical documentation for developers',
      topics: [
        'API Endpoints',
        'Authentication',
        'Request/Response Formats',
        'Error Handling',
      ],
    },
    {
      title: 'Configuration',
      icon: Settings,
      description: 'System configuration and customization',
      topics: [
        'System Settings',
        'Fraud Rules Configuration',
        'Notification Settings',
        'Integration Setup',
      ],
    },
    {
      title: 'Troubleshooting',
      icon: CheckCircle,
      description: 'Common issues and solutions',
      topics: [
        'Login Issues',
        'Performance Problems',
        'Data Sync Issues',
        'Browser Compatibility',
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
              <Book className="h-5 w-5" />
              <span className="text-sm font-medium">Documentation</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Guardian Shield Documentation
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Comprehensive guides and documentation to help you get the most out of 
              Guardian Shield fraud detection and management system.
            </p>
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section, index) => (
                <Card key={index} className="glass-card hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="p-3 rounded-lg gradient-primary w-fit mb-4">
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl mb-2">{section.title}</CardTitle>
                    <CardDescription className="text-base">{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.topics.map((topic, topicIndex) => (
                        <li key={topicIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl mb-2">Quick Links</CardTitle>
                <CardDescription>
                  Access frequently used documentation resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start h-auto py-3" asChild>
                    <Link to="/dashboard">
                      <FileText className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="font-semibold">Dashboard Guide</div>
                        <div className="text-xs text-muted-foreground">Learn about the dashboard</div>
                      </div>
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" asChild>
                    <Link to="/cases">
                      <Shield className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="font-semibold">Case Management</div>
                        <div className="text-xs text-muted-foreground">Managing fraud cases</div>
                      </div>
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" asChild>
                    <Link to="/transactions">
                      <FileText className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="font-semibold">Transaction Monitoring</div>
                        <div className="text-xs text-muted-foreground">Monitor transactions</div>
                      </div>
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" asChild>
                    <Link to="/support">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="font-semibold">Support Center</div>
                        <div className="text-xs text-muted-foreground">Get help and support</div>
                      </div>
                    </Link>
                  </Button>
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


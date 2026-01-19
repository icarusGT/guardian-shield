import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Activity,
  FileText,
  Users,
  Lock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Zap,
  Eye,
  ArrowRight,
  Check,
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Shield,
      title: 'Real-Time Fraud Detection',
      description: 'Advanced algorithms automatically detect suspicious transactions and flag potential fraud in real-time.',
    },
    {
      icon: Activity,
      title: 'Transaction Monitoring',
      description: 'Monitor all transactions across multiple channels with intelligent risk scoring and automated alerts.',
    },
    {
      icon: FileText,
      title: 'Case Management',
      description: 'Streamlined workflow for managing fraud cases from detection to resolution with full audit trails.',
    },
    {
      icon: Users,
      title: 'Investigation Workflow',
      description: 'Assign cases to investigators, track progress, and collaborate seamlessly with your team.',
    },
    {
      icon: Lock,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with role-based access control and comprehensive audit logging.',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Powerful dashboards and KPIs to track performance, closure rates, and investigation metrics.',
    },
  ];

  const stats = [
    { label: 'Cases Resolved', value: '10K+', icon: CheckCircle },
    { label: 'Avg Resolution Time', value: '24h', icon: Clock },
    { label: 'Detection Accuracy', value: '99.8%', icon: TrendingUp },
    { label: 'Active Users', value: '500+', icon: Users },
  ];

  const benefits = [
    'Automated fraud detection with machine learning',
    'Multi-channel transaction monitoring',
    'Role-based access control (Admin, Investigator, Auditor, Customer)',
    'Real-time alerts and notifications',
    'Comprehensive audit trails',
    'Evidence file management',
    'Investigation workflow automation',
    'Customizable fraud rules and thresholds',
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
              <span className="font-bold text-xl">FraudGuard</span>
            </div>
            <div className="flex items-center gap-4">
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

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Powered by AI & Machine Learning</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Protect Your Business from
              <span className="block text-primary mt-2">Fraud & Financial Crime</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Comprehensive fraud management system with real-time detection, intelligent case management,
              and streamlined investigation workflows. Trusted by financial institutions worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gradient-primary text-lg px-8" asChild>
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link to="/dashboard">View Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="glass-card text-center">
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to detect, investigate, and prevent fraud effectively
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="p-3 rounded-lg gradient-primary w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Why Choose FraudGuard?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our comprehensive platform provides everything you need to protect your business
                from financial fraud and maintain compliance with industry regulations.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-primary/10 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-base">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button size="lg" className="gradient-primary" asChild>
                  <Link to="/auth">
                    Get Started Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                  <CardTitle>Real-Time Alerts</CardTitle>
                  <CardDescription>
                    Get instant notifications when suspicious activity is detected
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="glass-card">
                <CardHeader>
                  <Eye className="h-8 w-8 text-blue-500 mb-2" />
                  <CardTitle>360° Visibility</CardTitle>
                  <CardDescription>
                    Complete visibility into all transactions and case activities
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="glass-card">
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Track KPIs and measure your fraud prevention effectiveness
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="glass-card">
                <CardHeader>
                  <Lock className="h-8 w-8 text-purple-500 mb-2" />
                  <CardTitle>Enterprise Security</CardTitle>
                  <CardDescription>
                    Bank-level security with encryption and access controls
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="glass-card border-2 border-primary/20">
            <CardContent className="pt-12 pb-12 text-center">
              <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Protect Your Business?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of companies using FraudGuard to detect and prevent fraud.
                Start your free trial today - no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="gradient-primary text-lg px-8" asChild>
                  <Link to="/auth">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                  <Link to="/dashboard">Schedule Demo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg gradient-primary">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">FraudGuard</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Advanced fraud management system for modern businesses.
              </p>
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
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} FraudGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


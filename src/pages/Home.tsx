// Last updated: 20th January 2025
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
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
  GraduationCap,
  Mail,
  Linkedin,
  Github,
  Building2,
  Phone,
  Terminal,
} from 'lucide-react';

export default function Home() {
  const { user, isAdmin, isAuditor } = useAuth();
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

  const teamMembers = [
    {
      name: 'Shahriar Kabir Saikat',
      role: 'Backend Developer',
      email: '0112410092@student.uiu.ac.bd',
      phone: '0112410092',
      linkedin: '#',
      github: '#',
      avatar: '',
      description: 'Expert in backend development and API architecture',
    },
    {
      name: 'Sayeda Sanjida Karim Eisa',
      role: 'DB Specialist',
      email: '0112410210@student.uiu.ac.bd',
      phone: '0112410210',
      linkedin: '#',
      github: '#',
      avatar: '',
      description: 'Specialized in database design and optimization',
    },
    {
      name: 'Sabiha Akhter',
      role: 'Frontend Developer',
      email: '0112410017@student.uiu.ac.bd',
      phone: '0112410017',
      linkedin: '#',
      github: '#',
      avatar: '',
      description: 'Focused on frontend development and user interface design',
    },
    {
      name: 'Rakibul Hasan Shanto',
      role: 'Design Specialist',
      email: '0112410206@student.uiu.ac.bd',
      phone: '0112410206',
      linkedin: '#',
      github: '#',
      avatar: '',
      description: 'Expert in UI/UX design and visual communication',
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
                <Link to="/query-debugger" className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Query Debugger
                </Link>
              </Button>
              {!user ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button className="gradient-primary" asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </>
              ) : (
                <Button className="gradient-primary" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <div className="bg-black p-3 rounded">
                <img 
                  src="/UniversityLogo.png" 
                  alt="United International University" 
                  className="h-10 w-auto object-contain"
                />
              </div>
              <span className="text-sm font-medium">United International University</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Guardian Shield
              <span className="block text-primary mt-2">Fraud Detection & Management System</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto text-justify">
              Comprehensive fraud management system with real-time detection, intelligent case management,
              and streamlined investigation workflows.
            </p>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-justify">
              Developed by <span className="font-bold text-primary">DataShaak</span> Team from United International University
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
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-justify">
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
                  <CardDescription className="text-base text-justify">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About University Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">About Our Institution</span>
            </div>
            <div className="flex justify-center mb-6">
              <div className="bg-black p-6 rounded-lg">
                <img 
                  src="/UniversityLogo.png" 
                  alt="United International University Logo" 
                  className="h-40 w-auto object-contain"
                />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              United International University
            </h2>
            <p className="text-lg text-muted-foreground mb-4 text-justify">
              United International University (UIU) is a leading private university in Bangladesh, 
              committed to excellence in education, research, and innovation. UIU provides a 
              world-class learning environment that nurtures creativity, critical thinking, and 
              technological advancement.
            </p>
            <p className="text-base text-muted-foreground text-justify">
              The <span className="font-bold">DataShaak</span> team is proud to represent UIU through this innovative fraud detection 
              and management system, showcasing the university's commitment to cutting-edge technology 
              and practical problem-solving.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Meet Our Team</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4"><span className="font-bold">DataShaak</span> Team</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-justify">
              A dedicated group of students from United International University working together 
              to build innovative solutions for fraud detection and management.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <Card key={index} className="glass-card hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center mb-4">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-xl mb-1">{member.name}</CardTitle>
                    <CardDescription className="text-base font-medium text-primary mb-2">
                      {member.role}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mb-3">{member.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <GraduationCap className="h-4 w-4" />
                      <span>United International University</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Phone className="h-4 w-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <a
                        href={`mailto:${member.email}`}
                        className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                        aria-label={`Email ${member.name}`}
                      >
                        <Mail className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </a>
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                        aria-label={`LinkedIn ${member.name}`}
                      >
                        <Linkedin className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </a>
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                        aria-label={`GitHub ${member.name}`}
                      >
                        <Github className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </a>
                    </div>
                  </div>
                </CardContent>
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
                Why Choose Guardian Shield?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 text-justify">
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
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-justify">
                Experience Guardian Shield by <span className="font-bold">DataShaak</span> - a comprehensive fraud detection and 
                management system developed by students of United International University.
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
      <Footer />
    </div>
  );
}


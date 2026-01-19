import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Footer from '@/components/Footer';
import {
  Shield,
  Building2,
  Users,
  Target,
  Lightbulb,
  ArrowLeft,
  GraduationCap,
  Code,
  Database,
  Zap,
  Lock,
} from 'lucide-react';

export default function About() {
  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'We are committed to creating innovative solutions that protect businesses from fraud and financial loss.',
    },
    {
      icon: Lightbulb,
      title: 'Innovation First',
      description: 'We leverage cutting-edge technology and best practices to deliver exceptional results.',
    },
    {
      icon: Users,
      title: 'Collaborative',
      description: 'We believe in teamwork, knowledge sharing, and building solutions together.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from code quality to user experience.',
    },
  ];

  const technologies = [
    { name: 'React', icon: Code },
    { name: 'TypeScript', icon: Code },
    { name: 'Supabase', icon: Database },
    { name: 'Real-time Analytics', icon: Zap },
    { name: 'Security', icon: Lock },
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
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">About Us</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              About <span className="font-bold">DataShaak</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto text-justify">
              A team of passionate students from United International University dedicated to 
              building innovative solutions for fraud detection and management.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="glass-card mb-8">
              <CardHeader>
                <CardTitle className="text-2xl mb-4">Who We Are</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p className="text-lg text-justify">
                  <span className="font-bold">DataShaak</span> is a student team from United International University (UIU) that 
                  specializes in developing cutting-edge software solutions. Our team consists 
                  of talented individuals with diverse skills in full-stack development, 
                  database design, DevOps, and quality assurance.
                </p>
                <p className="text-justify">
                  We are passionate about solving real-world problems through technology. 
                  Guardian Shield represents our commitment to creating a comprehensive fraud 
                  detection and management system that helps businesses protect themselves from 
                  financial fraud and maintain compliance with industry regulations.
                </p>
                <p className="text-justify">
                  Our team combines academic excellence with practical experience, ensuring that 
                  our solutions are not only technically sound but also user-friendly and 
                  production-ready.
                </p>
              </CardContent>
            </Card>

            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Values</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {values.map((value, index) => (
                  <Card key={index} className="glass-card">
                    <CardHeader>
                      <div className="p-3 rounded-lg gradient-primary w-fit mb-4">
                        <value.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl mb-2">{value.title}</CardTitle>
                      <CardDescription className="text-base text-justify">{value.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="glass-card mb-8">
              <CardHeader>
                <CardTitle className="text-2xl mb-4">Our Technology Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-justify">
                  We leverage modern technologies to build robust and scalable solutions:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {technologies.map((tech, index) => (
                    <div key={index} className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                      <tech.icon className="h-8 w-8 text-primary mb-2" />
                      <span className="text-sm font-medium">{tech.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl mb-4">Our University</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-black p-6 rounded-lg">
                    <img 
                      src="/UniversityLogo.png" 
                      alt="United International University Logo" 
                      className="h-32 w-auto object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold">United International University</h3>
                    </div>
                    <p className="text-muted-foreground text-justify">
                      United International University (UIU) is a leading private university in Bangladesh, 
                      committed to excellence in education, research, and innovation. UIU provides a 
                      world-class learning environment that nurtures creativity, critical thinking, and 
                      technological advancement. We are proud to represent UIU through our innovative 
                      projects and solutions.
                    </p>
                  </div>
                </div>
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


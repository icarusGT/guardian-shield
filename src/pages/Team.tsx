import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Footer from '@/components/Footer';
import {
  Shield,
  Users,
  GraduationCap,
  Mail,
  Linkedin,
  Github,
  ArrowLeft,
  Building2,
  Phone,
} from 'lucide-react';

export default function Team() {
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
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <div className="bg-black p-3 rounded">
                <img 
                  src="/UniversityLogo.png" 
                  alt="United International University" 
                  className="h-10 w-auto object-contain"
                />
              </div>
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Meet Our Team</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="font-bold">DataShaak</span> Team
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto text-justify">
              A dedicated group of students from United International University working together 
              to build innovative solutions for fraud detection and management.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>United International University</span>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <Card 
                key={index} 
                className="glass-card hover:shadow-lg transition-all duration-300 fade-in-up"
                style={{
                  animationDelay: `${index * 0.15}s`
                }}
              >
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6 group">
                      {/* Animated glow effect behind avatar */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-60 blur-2xl group-hover:opacity-100 transition-opacity duration-500 avatar-glow" style={{ transform: 'translateZ(0)' }}></div>
                      
                      {/* Rotating gradient border wrapper */}
                      <div className="avatar-border-animated inline-block">
                        <Avatar className="h-32 w-32 shadow-2xl relative z-10 avatar-animated group-hover:scale-110 transition-all duration-500 border-4 border-background">
                          <AvatarImage 
                            src={member.avatar} 
                            alt={member.name}
                            className="transition-transform duration-500 group-hover:scale-105"
                          />
                          <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/20 via-purple-500/20 to-blue-500/20 text-primary transition-all duration-500 group-hover:from-primary/30 group-hover:via-purple-500/30 group-hover:to-blue-500/30">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      {/* Outer pulse ring */}
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20 avatar-pulse pointer-events-none" style={{ transform: 'translateZ(0)' }}></div>
                    </div>
                    <CardTitle className="text-2xl mb-2">{member.name}</CardTitle>
                    <CardDescription className="text-lg font-semibold text-primary mb-3">
                      {member.role}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mb-4 text-justify max-w-md">
                      {member.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <GraduationCap className="h-4 w-4" />
                      <span>United International University</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <Phone className="h-4 w-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-4">
                      <a
                        href={`mailto:${member.email}`}
                        className="p-3 rounded-full hover:bg-primary/10 transition-colors border border-border hover:border-primary/30"
                        aria-label={`Email ${member.name}`}
                        title={`Email: ${member.email}`}
                      >
                        <Mail className="h-5 w-5 text-muted-foreground hover:text-primary" />
                      </a>
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full hover:bg-primary/10 transition-colors border border-border hover:border-primary/30"
                        aria-label={`LinkedIn ${member.name}`}
                        title="LinkedIn Profile"
                      >
                        <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary" />
                      </a>
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full hover:bg-primary/10 transition-colors border border-border hover:border-primary/30"
                        aria-label={`GitHub ${member.name}`}
                        title="GitHub Profile"
                      >
                        <Github className="h-5 w-5 text-muted-foreground hover:text-primary" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}


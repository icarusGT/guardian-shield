import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Shield,
  Users,
  GraduationCap,
  Mail,
  Linkedin,
  Github,
  ArrowLeft,
  Building2,
  Award,
} from 'lucide-react';

export default function Team() {
  const teamMembers = [
    {
      name: 'Team Member 1',
      role: 'Project Lead / Developer',
      email: 'member1@student.uiu.ac.bd',
      linkedin: '#',
      github: '#',
      avatar: '',
      description: 'Leading the development and architecture of Guardian Shield',
    },
    {
      name: 'Team Member 2',
      role: 'Full Stack Developer',
      email: 'member2@student.uiu.ac.bd',
      linkedin: '#',
      github: '#',
      avatar: '',
      description: 'Specialized in frontend and backend integration',
    },
    {
      name: 'Team Member 3',
      role: 'Backend Developer',
      email: 'member3@student.uiu.ac.bd',
      linkedin: '#',
      github: '#',
      avatar: '',
      description: 'Expert in database design and API development',
    },
    {
      name: 'Team Member 4',
      role: 'Frontend Developer',
      email: 'member4@student.uiu.ac.bd',
      linkedin: '#',
      github: '#',
      avatar: '',
      description: 'Focused on UI/UX design and user experience',
    },
    {
      name: 'Team Member 5',
      role: 'DevOps Engineer',
      email: 'member5@student.uiu.ac.bd',
      linkedin: '#',
      github: '#',
      avatar: '',
      description: 'Managing deployment and infrastructure',
    },
    {
      name: 'Team Member 6',
      role: 'QA Engineer',
      email: 'member6@student.uiu.ac.bd',
      linkedin: '#',
      github: '#',
      avatar: '',
      description: 'Ensuring quality and testing the system',
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
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Meet Our Team</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              DataShaak Team
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    <p className="text-sm text-muted-foreground mb-4">{member.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <GraduationCap className="h-4 w-4" />
                      <span>United International University</span>
                    </div>
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


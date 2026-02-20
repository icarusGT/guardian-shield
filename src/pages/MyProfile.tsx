// Last updated: 20th February 2026
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Info,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

const BANGLADESH_REGIONS = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal',
  'Sylhet', 'Rangpur', 'Mymensingh', 'Comilla', 'Gazipur',
  'Narayanganj', 'Tongi', 'Bogra', 'Cox\'s Bazar', 'Jessore',
  'Dinajpur', 'Brahmanbaria', 'Savar', 'Tangail', 'Narsingdi',
  'Jamalpur', 'Kushtia', 'Habiganj', 'Faridpur', 'Chandpur',
  'Manikganj', 'Lakshmipur', 'Feni', 'Noakhali', 'Madaripur',
  'Gopalganj', 'Shariatpur', 'Munshiganj', 'Rajbari', 'Kishoreganj',
  'Netrokona', 'Sherpur', 'Sunamganj', 'Moulvibazar', 'Pabna',
  'Sirajganj', 'Natore', 'Naogaon', 'Chapainawabganj', 'Nawabganj',
  'Joypurhat', 'Satkhira', 'Bagerhat', 'Narail', 'Magura',
  'Jhenaidah', 'Chuadanga', 'Meherpur', 'Pirojpur', 'Jhalokati',
  'Patuakhali', 'Bhola', 'Barguna', 'Thakurgaon', 'Panchagarh',
  'Lalmonirhat', 'Nilphamari', 'Kurigram', 'Gaibandha',
].sort();

export default function MyProfile() {
  const { user, loading, profile, isCustomer } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fullName, setFullName] = useState('');
  const [primaryRegion, setPrimaryRegion] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [regionSearch, setRegionSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!loading && !isCustomer) {
      navigate('/dashboard');
      return;
    }
  }, [user, loading, isCustomer, navigate]);

  useEffect(() => {
    if (user && isCustomer) {
      fetchProfileData();
    }
  }, [user, isCustomer]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoadingProfile(true);

    try {
      // Fetch user profile
      const { data: userData } = await supabase
        .from('users_safe')
        .select('full_name, phone')
        .eq('user_id', user.id)
        .single();

      if (userData) {
        setFullName(userData.full_name || '');
        setPhone(userData.phone || '');
      }

      // Fetch customer data
      const { data: custData } = await supabase
        .from('customers')
        .select('customer_id, primary_region, address')
        .eq('user_id', user.id)
        .single();

      if (custData) {
        setCustomerId(custData.customer_id);
        setPrimaryRegion(custData.primary_region || '');
        setAddress(custData.address || '');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!primaryRegion) newErrors.primaryRegion = 'Primary Region is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user || !customerId) return;

    setSaving(true);
    try {
      // Update full_name in users table
      const { error: userError } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('user_id', user.id);

      if (userError) throw userError;

      // Update customer profile
      const { error: custError } = await supabase
        .from('customers')
        .update({
          primary_region: primaryRegion,
          address: address.trim() || null,
        })
        .eq('user_id', user.id);

      if (custError) throw custError;

      toast.success('Profile updated successfully!');
      setErrors({});
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const filteredRegions = BANGLADESH_REGIONS.filter(r =>
    r.toLowerCase().includes(regionSearch.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account details and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Identity Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Avatar */}
                  <div className="avatar-border-animated">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary">
                        {fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">{fullName || 'New User'}</h2>
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Customer
                    </Badge>
                  </div>

                  <div className="w-full pt-4 border-t border-border space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{user?.email}</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto flex-shrink-0" />
                    </div>
                    {phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{phone}</span>
                      </div>
                    )}
                    {primaryRegion && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{primaryRegion}</span>
                      </div>
                    )}
                  </div>

                  {/* Account Status */}
                  <div className="w-full pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Account Status</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile Details
                </CardTitle>
                <CardDescription>
                  Update your personal information and region preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    maxLength={100}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      value={user?.email || ''}
                      readOnly
                      className="bg-muted pr-10"
                    />
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Verified email address
                  </p>
                </div>

                {/* Phone (read-only if set) */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    readOnly
                    className="bg-muted"
                    placeholder="Not set"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to update your phone number
                  </p>
                </div>

                {/* Primary Region */}
                <div className="space-y-2">
                  <Label htmlFor="primaryRegion">
                    Primary Region / City <span className="text-destructive">*</span>
                  </Label>
                  <Select value={primaryRegion} onValueChange={setPrimaryRegion}>
                    <SelectTrigger id="primaryRegion" className={errors.primaryRegion ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select your primary region" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 pb-2">
                        <Input
                          placeholder="Search regions..."
                          value={regionSearch}
                          onChange={(e) => setRegionSearch(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      {filteredRegions.map((region) => (
                        <SelectItem key={region} value={region}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {region}
                          </div>
                        </SelectItem>
                      ))}
                      {filteredRegions.length === 0 && (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          No regions found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.primaryRegion && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.primaryRegion}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Used to detect unusual location patterns for fraud risk.
                  </p>
                </div>

                {/* Address (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address (optional)</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your address"
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sticky Save Bar */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-4 -mx-6 px-6 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="btn-glow-primary gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

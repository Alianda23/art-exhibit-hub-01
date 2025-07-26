
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerArtist, isArtist } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const ArtistSignup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Redirect if already logged in as artist
  React.useEffect(() => {
    if (isArtist()) {
      navigate('/artist');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast({
        title: "Error",
        description: "Name, email and password are required.",
        variant: "destructive"
      });
      return;
    }

    // Phone validation (only if phone is provided)
    if (phone && !/^\d{10,12}$/.test(phone)) {
      toast({
        title: "Error",
        description: "Phone number must be between 10 and 12 digits",
        variant: "destructive"
      });
      return;
    }

    // Password validation
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      toast({
        title: "Error",
        description: "Password must contain at least 1 letter, 1 number, and 1 special character",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await registerArtist({ 
        name, 
        email, 
        password, 
        phone,
        bio
      });
      
      if (response.error) {
        toast({
          title: "Registration Failed",
          description: response.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Registration successful. Welcome to your artist portal!",
        });
        navigate('/artist');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Artist Signup</CardTitle>
          <CardDescription>
            Create an artist account to showcase and sell your artwork
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="artist@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional - 10 to 12 digits)</Label>
              <Input
                id="phone"
                placeholder="07123456789"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setPhone(value);
                }}
                maxLength={12}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Artist Bio (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself and your art..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Artist Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-500">
            Already have an artist account?{" "}
            <Link to="/artist-login" className="text-blue-500 hover:text-blue-700">
              Login
            </Link>
          </div>
          <div className="text-sm text-center text-gray-500">
            <Link to="/signup" className="text-blue-500 hover:text-blue-700">
              User Signup
            </Link>
            {" | "}
            <Link to="/" className="text-blue-500 hover:text-blue-700">
              Back to Gallery
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ArtistSignup;

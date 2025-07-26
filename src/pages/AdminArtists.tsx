
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllArtists, isAdmin } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { Loader2, User } from 'lucide-react';
import { ArtistData } from '@/services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminArtists = () => {
  const [artists, setArtists] = useState<ArtistData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if user is an admin
  React.useEffect(() => {
    if (!isAdmin()) {
      navigate('/admin-login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await getAllArtists();
        setArtists(response.artists || []);
      } catch (error) {
        console.error('Failed to fetch artists:', error);
        toast({
          title: "Error",
          description: "Failed to load artist data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Registered Artists</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Artists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{artists.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Artworks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {artists.reduce((total, artist) => total + artist.artwork_count, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Most Active Artist</CardTitle>
            </CardHeader>
            <CardContent>
              {artists.length > 0 ? (
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={artists.sort((a, b) => b.artwork_count - a.artwork_count)[0].profile_image_url} alt="Artist" />
                    <AvatarFallback>{getInitials(artists.sort((a, b) => b.artwork_count - a.artwork_count)[0].name)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium">
                    {artists.sort((a, b) => b.artwork_count - a.artwork_count)[0].name}
                    <div className="text-xs text-muted-foreground">
                      {artists.sort((a, b) => b.artwork_count - a.artwork_count)[0].artwork_count} artworks
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm">No artists registered</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {artists.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg shadow">
            <p className="text-gray-500">No artists have registered yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artist</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Artworks</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artists.map((artist) => (
                  <TableRow key={artist.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={artist.profile_image_url} alt={artist.name} />
                          <AvatarFallback>{getInitials(artist.name)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{artist.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{artist.email}</TableCell>
                    <TableCell>{artist.phone || 'Not provided'}</TableCell>
                    <TableCell>{artist.artwork_count}</TableCell>
                    <TableCell>{formatDate(artist.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminArtists;

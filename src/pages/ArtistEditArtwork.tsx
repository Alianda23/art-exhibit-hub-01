
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArtwork, updateArtwork } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ArtistLayout from '@/components/ArtistLayout';
import ArtworkForm from '@/components/ArtworkForm';
import { Loader2 } from 'lucide-react';

const ArtistEditArtwork = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtwork = async () => {
      if (!id) return;
      
      try {
        console.log('Fetching artwork with ID:', id);
        setLoading(true);
        const response = await getArtwork(id);
        console.log('Artwork response:', response);
        
        if (response.error) {
          console.error('Error response:', response.error);
          setError(response.error);
          toast({
            title: "Error",
            description: response.error,
            variant: "destructive",
          });
          setArtwork(null);
        } else if (!response.id) {
          console.error('No artwork found with ID:', id);
          setError("Artwork not found");
          toast({
            title: "Error",
            description: "Artwork not found",
            variant: "destructive",
          });
          setArtwork(null);
        } else {
          console.log('Artwork found:', response);
          // Process the artwork data to ensure consistency
          const processedArtwork = {
            ...response,
            imageUrl: response.image_url || response.imageUrl || null
          };
          setArtwork(processedArtwork);
          setError(null);
        }
      } catch (error: any) {
        console.error('Error fetching artwork:', error);
        setError(error.message || 'Failed to fetch artwork details');
        toast({
          title: "Error",
          description: "Failed to fetch artwork details. Please try again.",
          variant: "destructive",
        });
        setArtwork(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id, toast]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    
    try {
      setSubmitting(true);
      console.log('Updating artwork with data:', data);
      // Ensure image URL is properly formatted for the API
      if (data.imageUrl && !data.imageUrl.startsWith('data:') && !data.imageUrl.startsWith('/static/') && !data.imageUrl.startsWith('http')) {
        console.log('Converting image URL to proper format');
        data.imageUrl = `/static/uploads/${data.imageUrl}`;
      }
      
      const response = await updateArtwork(id, data);
      
      if (response.error) {
        console.error('Error updating artwork:', response.error);
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Artwork updated successfully.",
        });
        navigate('/artist/artworks');
      }
    } catch (error: any) {
      console.error('Error updating artwork:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update artwork. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/artist/artworks');
  };

  if (loading) {
    return (
      <ArtistLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ArtistLayout>
    );
  }

  return (
    <ArtistLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Artwork</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {artwork ? (
          <ArtworkForm
            initialData={artwork}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={submitting}
          />
        ) : (
          <div className="text-center p-8">
            <p className="text-gray-500">Artwork not found. Please return to your artworks list and try again.</p>
          </div>
        )}
      </div>
    </ArtistLayout>
  );
};

export default ArtistEditArtwork;

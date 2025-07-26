
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createArtwork } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ArtistLayout from '@/components/ArtistLayout';
import ArtworkForm from '@/components/ArtworkForm';

const ArtistAddArtwork = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      // The artist name will be automatically filled from the token on the server
      const result = await createArtwork(data);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error || "Failed to create artwork. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Artwork created successfully.",
      });
      navigate('/artist/artworks');
    } catch (error) {
      console.error('Error creating artwork:', error);
      toast({
        title: "Error",
        description: "Failed to create artwork. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate('/artist/artworks');
  };

  return (
    <ArtistLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Add New Artwork</h1>
        
        <ArtworkForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </ArtistLayout>
  );
};

export default ArtistAddArtwork;

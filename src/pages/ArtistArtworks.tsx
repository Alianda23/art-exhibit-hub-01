
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getArtistArtworks, deleteArtwork } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ArtistLayout from '@/components/ArtistLayout';
import ArtworkTable from '@/components/ArtworkTable';
import { Button } from '@/components/ui/button';
import { Artwork } from '@/types';
import { Loader2, PlusCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ArtistArtworks = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [artworkToDelete, setArtworkToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchArtworks = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching artist artworks...');
      const response = await getArtistArtworks();
      console.log('Artist artworks response:', response);
      
      if (response.error) {
        setError(response.error);
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        setArtworks([]);
      } else {
        const processedArtworks = (response.artworks || []).map((artwork: any) => ({
          ...artwork,
          // Ensure consistent image URL field (handle both image_url and imageUrl)
          imageUrl: artwork.image_url || artwork.imageUrl || null,
          // Ensure ID is always a string
          id: artwork.id.toString()
        }));
        
        console.log('Processed artworks:', processedArtworks);
        setArtworks(processedArtworks);
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error);
      setError('Failed to load artworks');
      toast({
        title: "Error",
        description: "Failed to load artworks. Please try again.",
        variant: "destructive",
      });
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  const handleAddArtwork = () => {
    navigate('/artist/add-artwork');
  };

  const handleEditArtwork = (artwork: Artwork) => {
    navigate(`/artist/edit-artwork/${artwork.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!artworkToDelete) return;
    
    setDeleteLoading(true);
    try {
      console.log('Deleting artwork:', artworkToDelete);
      const response = await deleteArtwork(artworkToDelete);
      
      if (response.error) {
        console.error('Error deleting artwork:', response.error);
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Artwork deleted successfully.",
        });
        fetchArtworks();
      }
    } catch (error: any) {
      console.error('Failed to delete artwork:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete artwork. Please try again.",
        variant: "destructive",
      });
    } finally {
      setArtworkToDelete(null);
      setDeleteLoading(false);
    }
  };

  const handleDeleteDialog = (id: string) => {
    setArtworkToDelete(id);
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Artworks</h1>
          <Button onClick={handleAddArtwork}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Artwork
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {artworks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">You haven't added any artworks yet.</p>
            <Button onClick={handleAddArtwork}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Artwork
            </Button>
          </div>
        ) : (
          <ArtworkTable 
            artworks={artworks} 
            onEdit={handleEditArtwork} 
            onDelete={handleDeleteDialog} 
          />
        )}

        <AlertDialog open={!!artworkToDelete} onOpenChange={() => setArtworkToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your artwork from our system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteLoading}>
                {deleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ArtistLayout>
  );
};

export default ArtistArtworks;


import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllArtworks, createArtwork, updateArtwork, deleteArtwork, ArtworkData } from '@/services/api';
import { createImageSrc, handleImageError } from '@/utils/imageUtils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ArtworkForm from "@/components/ArtworkForm";
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

// Mock data to use when backend is unavailable
const mockArtworks: ArtworkData[] = [
  {
    id: "1",
    title: "Sunset in Paradise",
    artist: "Jane Doe",
    description: "A beautiful sunset painting",
    price: 1200,
    imageUrl: "/placeholder.svg",
    dimensions: "24 x 36 inches",
    medium: "Oil on canvas",
    year: 2023,
    status: "available"
  },
  {
    id: "2",
    title: "Urban Landscape",
    artist: "John Smith",
    description: "Modern city skyline",
    price: 950,
    imageUrl: "/placeholder.svg",
    dimensions: "18 x 24 inches",
    medium: "Acrylic on canvas",
    year: 2024,
    status: "available"
  },
  {
    id: "3",
    title: "Abstract Emotions",
    artist: "Maria Garcia",
    description: "Expression of human emotions through colors",
    price: 1500,
    imageUrl: "/placeholder.svg",
    dimensions: "30 x 40 inches",
    medium: "Mixed media",
    year: 2023,
    status: "sold"
  }
];

const AdminArtworks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkData | null>(null);
  const [artworkToDelete, setArtworkToDelete] = useState<ArtworkData | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Fetch all artworks - using valid options for this version of react-query
  const { data, isLoading, error } = useQuery({
    queryKey: ['artworks'],
    queryFn: getAllArtworks
  });

  // Handle success/error effects separately
  useEffect(() => {
    if (data) {
      console.log("Successfully fetched artworks:", data);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      console.error("Failed to fetch artworks:", error);
      setOfflineMode(true);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not connect to server. Operating in offline mode.",
      });
    }
  }, [error, toast]);

  // Create artwork mutation
  const createArtworkMutation = useMutation({
    mutationFn: createArtwork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      toast({
        title: "Success",
        description: "Artwork created successfully",
      });
      setIsDialogOpen(false);
      setSelectedArtwork(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create artwork. Please try again.",
      });
      console.error("Create artwork error:", error);
    }
  });

  // Update artwork mutation
  const updateArtworkMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: ArtworkData }) => 
      updateArtwork(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      toast({
        title: "Success",
        description: "Artwork updated successfully",
      });
      setIsDialogOpen(false);
      setSelectedArtwork(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update artwork. Please try again.",
      });
      console.error("Update artwork error:", error);
    }
  });

  // Delete artwork mutation
  const deleteArtworkMutation = useMutation({
    mutationFn: (id: string) => deleteArtwork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      toast({
        title: "Success",
        description: "Artwork deleted successfully",
      });
      setIsAlertDialogOpen(false);
      setArtworkToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete artwork. Please try again.",
      });
      console.error("Delete artwork error:", error);
      setIsAlertDialogOpen(false);
    }
  });
  
  // Handler functions
  const handleAddArtwork = () => {
    setSelectedArtwork(null);
    setIsDialogOpen(true);
  };
  
  const handleEditArtwork = (artwork: ArtworkData) => {
    setSelectedArtwork(artwork);
    setIsDialogOpen(true);
  };
  
  const handleDeleteArtwork = (artwork: ArtworkData) => {
    setArtworkToDelete(artwork);
    setIsAlertDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (artworkToDelete?.id) {
      deleteArtworkMutation.mutate(artworkToDelete.id);
    }
  };

  const handleFormSubmit = (formData: ArtworkData) => {
    console.log("Submitting artwork form data:", formData);
    if (selectedArtwork?.id) {
      updateArtworkMutation.mutate({ 
        id: selectedArtwork.id, 
        data: formData 
      });
    } else {
      createArtworkMutation.mutate(formData);
    }
  };

  // Change here: format price in KSH without dollar sign
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Log the artworks data to help with debugging
  useEffect(() => {
    if (data) {
      console.log("Artworks data received:", data);
      // Check image URLs
      data.forEach((artwork: ArtworkData) => {
        const processedUrl = createImageSrc(artwork.imageUrl);
        console.log(`Artwork: ${artwork.title}, Original URL: ${artwork.imageUrl}, Processed URL: ${processedUrl}`);
      });
    }
  }, [data]);

  // Determine which artworks to display (real or mock)
  const artworksToDisplay = offlineMode ? mockArtworks : (data || []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Artworks Management</h1>
        <p>Loading artworks...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Artworks Management</h1>
        <Button onClick={handleAddArtwork} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Artwork
        </Button>
      </div>
      
      {offlineMode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Warning:</span> Operating in offline mode with sample data. Changes will not be saved to the server.
            </p>
          </div>
        </div>
      )}
      
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artworksToDisplay.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No artworks found
                  </TableCell>
                </TableRow>
              ) : (
                artworksToDisplay.map((artwork: ArtworkData) => (
                  <TableRow key={artwork.id}>
                    <TableCell>
                      <img 
                        src={createImageSrc(artwork.imageUrl)} 
                        alt={artwork.title} 
                        className="w-16 h-16 object-cover rounded"
                        onError={handleImageError}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{artwork.title}</TableCell>
                    <TableCell>{artwork.artist}</TableCell>
                    <TableCell>{formatPrice(artwork.price)}</TableCell>
                    <TableCell>
                      <Badge className={artwork.status === 'available' ? 'bg-green-500' : 'bg-gray-500'}>
                        {artwork.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditArtwork(artwork)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteArtwork(artwork)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Artwork Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedArtwork ? 'Edit Artwork' : 'Add New Artwork'}
            </DialogTitle>
          </DialogHeader>
          <ArtworkForm
            initialData={selectedArtwork || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this artwork?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              artwork and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminArtworks;


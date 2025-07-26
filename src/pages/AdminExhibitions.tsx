
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllExhibitions, createExhibition, updateExhibition, deleteExhibition, ExhibitionData } from '@/services/api';
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
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ExhibitionForm from "@/components/ExhibitionForm";
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

const AdminExhibitions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [selectedExhibition, setSelectedExhibition] = useState<ExhibitionData | null>(null);
  const [exhibitionToDelete, setExhibitionToDelete] = useState<ExhibitionData | null>(null);
  
  // Fetch all exhibitions
  const { data, isLoading, error } = useQuery({
    queryKey: ['exhibitions'],
    queryFn: getAllExhibitions,
  });

  // Create exhibition mutation
  const createExhibitionMutation = useMutation({
    mutationFn: createExhibition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
      toast({
        title: "Success",
        description: "Exhibition created successfully",
      });
      setIsDialogOpen(false);
      setSelectedExhibition(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create exhibition. Please try again.",
      });
      console.error("Create exhibition error:", error);
    }
  });

  // Update exhibition mutation
  const updateExhibitionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: ExhibitionData }) => 
      updateExhibition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
      toast({
        title: "Success",
        description: "Exhibition updated successfully",
      });
      setIsDialogOpen(false);
      setSelectedExhibition(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update exhibition. Please try again.",
      });
      console.error("Update exhibition error:", error);
    }
  });

  // Delete exhibition mutation
  const deleteExhibitionMutation = useMutation({
    mutationFn: (id: string) => deleteExhibition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
      toast({
        title: "Success",
        description: "Exhibition deleted successfully",
      });
      setIsAlertDialogOpen(false);
      setExhibitionToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete exhibition. Please try again.",
      });
      console.error("Delete exhibition error:", error);
      setIsAlertDialogOpen(false);
    }
  });
  
  const handleAddExhibition = () => {
    setSelectedExhibition(null);
    setIsDialogOpen(true);
  };
  
  const handleEditExhibition = (exhibition: ExhibitionData) => {
    setSelectedExhibition(exhibition);
    setIsDialogOpen(true);
  };
  
  const handleDeleteExhibition = (exhibition: ExhibitionData) => {
    setExhibitionToDelete(exhibition);
    setIsAlertDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (exhibitionToDelete?.id) {
      deleteExhibitionMutation.mutate(exhibitionToDelete.id);
    }
  };

  const handleFormSubmit = (formData: ExhibitionData) => {
    console.log("Submitting exhibition form data:", formData);
    if (selectedExhibition?.id) {
      updateExhibitionMutation.mutate({ 
        id: selectedExhibition.id, 
        data: formData 
      });
    } else {
      createExhibitionMutation.mutate(formData);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PP');
    } catch (error) {
      return dateString;
    }
  };

  // Function to fix image URL issues
  const getValidImageUrl = (url: string) => {
    if (!url) return '/placeholder.svg';
    
    // Handle relative paths
    if (url.startsWith('/static/')) {
      // Ensure server-side paths are properly prefixed
      return url;
    }
    
    // Check if URL is too long (likely invalid)
    if (url.length > 500) {
      return '/placeholder.svg';
    }
    
    return url;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500';
      case 'ongoing':
        return 'bg-green-500';
      case 'past':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Exhibitions Management</h1>
        <p>Loading exhibitions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Exhibitions Management</h1>
        <p className="text-red-500">Error loading exhibitions</p>
      </div>
    );
  }

  const exhibitions = data || [];
  console.log("Rendered exhibitions:", exhibitions);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exhibitions Management</h1>
        <Button onClick={handleAddExhibition} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Exhibition
        </Button>
      </div>
      
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exhibitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No exhibitions found
                  </TableCell>
                </TableRow>
              ) : (
                exhibitions.map((exhibition: ExhibitionData) => (
                  <TableRow key={exhibition.id}>
                    <TableCell>
                      <img 
                        src={getValidImageUrl(exhibition.imageUrl)} 
                        alt={exhibition.title} 
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          console.error("Exhibition image failed to load:", exhibition.imageUrl);
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{exhibition.title}</TableCell>
                    <TableCell>
                      {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
                    </TableCell>
                    <TableCell>{exhibition.location}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(exhibition.status)}>
                        {exhibition.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditExhibition(exhibition)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteExhibition(exhibition)}
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

      {/* Exhibition Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedExhibition ? 'Edit Exhibition' : 'Add New Exhibition'}
            </DialogTitle>
          </DialogHeader>
          <ExhibitionForm
            initialData={selectedExhibition || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this exhibition?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              exhibition and remove it from our servers.
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

export default AdminExhibitions;

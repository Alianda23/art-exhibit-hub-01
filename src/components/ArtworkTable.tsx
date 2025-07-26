
import React from 'react';
import { Button } from './ui/button';
import { Artwork } from '@/types';
import { createImageSrc, handleImageError } from '@/utils/imageUtils';
import { formatPrice } from '@/utils/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from 'lucide-react';

interface ArtworkTableProps {
  artworks: Artwork[];
  onEdit: (artwork: Artwork) => void;
  onDelete: (id: string) => void;
  deleteInProgress?: string;
}

const ArtworkTable: React.FC<ArtworkTableProps> = ({ 
  artworks, 
  onEdit, 
  onDelete, 
  deleteInProgress 
}) => {
  const getImageUrl = (artwork: Artwork) => {
    // Handle both image_url and imageUrl fields
    const imageSource = artwork.image_url || artwork.imageUrl;
    console.log(`ArtworkTable: Processing image for ${artwork.title}: Source=${imageSource}`);
    return createImageSrc(imageSource);
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artworks.map((artwork) => (
            <TableRow key={artwork.id} className="hover:bg-muted/50">
              <TableCell>
                <img 
                  src={getImageUrl(artwork)} 
                  alt={artwork.title}
                  className="h-16 w-16 object-cover rounded"
                  onError={handleImageError}
                />
              </TableCell>
              <TableCell className="font-medium">{artwork.title}</TableCell>
              <TableCell>{artwork.artist}</TableCell>
              <TableCell>{formatPrice(artwork.price)}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  artwork.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {artwork.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  onClick={() => onEdit(artwork)}
                  variant="ghost"
                  className="mr-2"
                  size="sm"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => onDelete(artwork.id)}
                  variant="ghost"
                  className="text-red-600 hover:text-red-800"
                  size="sm"
                  disabled={deleteInProgress === artwork.id}
                >
                  {deleteInProgress === artwork.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ArtworkTable;

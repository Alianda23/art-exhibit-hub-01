import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { formatPrice, formatDateRange } from '@/utils/formatters';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Calendar, Ticket, Users, Ban } from 'lucide-react';
import ExhibitionCard from '@/components/ExhibitionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Exhibition } from '@/types';
import { getExhibition, getAllExhibitions } from '@/services/api';
import { createImageSrc, handleImageError } from '@/utils/imageUtils';

const ExhibitionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState(1);
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [relatedExhibitions, setRelatedExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExhibition = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getExhibition(id);
        setExhibition(data);
        
        // Fetch all exhibitions to get related ones
        const allExhibitions = await getAllExhibitions();
        const related = allExhibitions
          .filter((e: Exhibition) => e.id !== id)
          .slice(0, 2);
        
        setRelatedExhibitions(related);
      } catch (error) {
        console.error('Failed to fetch exhibition:', error);
        toast({
          title: "Error",
          description: "Failed to load exhibition details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExhibition();
  }, [id, toast]);

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book exhibition tickets",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    if (!exhibition) return;
    
    // Check if exhibition is sold out
    if (exhibition.availableSlots === 0) {
      toast({
        title: "Exhibition Sold Out",
        description: "This exhibition has no available slots remaining.",
        variant: "destructive",
      });
      return;
    }
    
    if (slots > exhibition.availableSlots) {
      toast({
        title: "Error",
        description: `Only ${exhibition.availableSlots} slots available`,
        variant: "destructive",
      });
      return;
    }
    
    navigate(`/exhibitions/${id}/checkout?slots=${slots}`);
  };

  if (loading) {
    return (
      <div className="py-16 px-4 text-center">
        <h1 className="text-2xl font-semibold mb-4">Loading Exhibition...</h1>
        <p className="mb-6">Please wait while we fetch the exhibition details.</p>
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="py-16 px-4 text-center">
        <h1 className="text-2xl font-semibold mb-4">Exhibition Not Found</h1>
        <p className="mb-6">The exhibition you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/exhibitions')}>
          Back to Exhibitions
        </Button>
      </div>
    );
  }

  const isSoldOut = exhibition?.availableSlots === 0;
  const isPast = exhibition?.status === 'past';
  const isUnavailable = isSoldOut || isPast;

  return (
    <div className="py-12 px-4 md:px-6 bg-secondary min-h-screen">
      <div className="container mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
            <div className="p-6 lg:p-8">
              <div className="relative">
                <AspectRatio ratio={16/9} className="overflow-hidden rounded-lg">
                  <img 
                    src={exhibition ? createImageSrc(exhibition.imageUrl) : ''}
                    alt={exhibition?.title || 'Exhibition'}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </AspectRatio>
                {isSoldOut && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2">
                    <Ban className="h-5 w-5" />
                    <span>Sold Out</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 lg:p-8 flex flex-col">
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                {exhibition.title}
              </h1>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gold" />
                  <span>{formatDateRange(exhibition.startDate, exhibition.endDate)}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gold" />
                  <span>{exhibition.location}</span>
                </div>
                <div className="flex items-center">
                  <Ticket className="h-5 w-5 mr-2 text-gold" />
                  <span>{formatPrice(exhibition.ticketPrice)} per ticket</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-gold" />
                  {isSoldOut ? (
                    <span className="text-red-500 font-medium">Sold Out - No slots available</span>
                  ) : (
                    <span>{exhibition.availableSlots} slots available</span>
                  )}
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="font-medium text-lg mb-2">About the Exhibition</h3>
                <p className="text-gray-600">{exhibition.description}</p>
              </div>
              
              <div className="mt-auto space-y-6">
                {!isUnavailable && (
                  <div className="space-y-2">
                    <Label htmlFor="slots">Number of Tickets</Label>
                    <Input
                      id="slots"
                      type="number"
                      min={1}
                      max={exhibition.availableSlots}
                      value={slots}
                      onChange={(e) => setSlots(parseInt(e.target.value) || 1)}
                    />
                    <p className="text-sm text-gray-500">
                      Total: {formatPrice(exhibition.ticketPrice * slots)}
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={handleBookNow}
                  className={`w-full py-6 text-lg ${
                    isUnavailable 
                      ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                      : 'bg-gold hover:bg-gold-dark'
                  } text-white`}
                  disabled={isUnavailable}
                >
                  {isSoldOut ? 'Sold Out' : isPast ? 'Past Exhibition' : 'Book Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {relatedExhibitions.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-serif font-bold mb-8">
              Other Exhibitions You Might Like
            </h2>
            <div className="exhibition-grid">
              {relatedExhibitions.map((relatedExhibition) => (
                <ExhibitionCard key={relatedExhibition.id} exhibition={relatedExhibition} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExhibitionDetail;

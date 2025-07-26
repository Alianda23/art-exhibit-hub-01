import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/utils/formatters';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getArtwork } from '@/services/api';
import { Artwork } from '@/types';
import { Check, Ban } from 'lucide-react';

const DELIVERY_FEE = 500; // KSh 500 for delivery

const ArtworkCheckout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    deliveryAddress: '',
    notes: ''
  });
  
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  useEffect(() => {
    const fetchArtwork = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getArtwork(id);
        setArtwork(data);
        
        // Check if artwork is sold and redirect if necessary
        if (data.status === 'sold') {
          toast({
            title: "Artwork Unavailable",
            description: "This artwork has already been sold and is no longer available for purchase.",
            variant: "destructive",
          });
          navigate(`/artworks/${id}`);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch artwork:', error);
        toast({
          title: "Error",
          description: "Failed to load artwork details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id, toast, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number for delivery coordination.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.deliveryAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your delivery address.",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check artwork availability before proceeding
    if (artwork?.status === 'sold') {
      toast({
        title: "Artwork No Longer Available",
        description: "This artwork has been sold while you were checking out. Please select another artwork.",
        variant: "destructive",
      });
      navigate(`/artworks/${id}`);
      return;
    }
    
    setIsSubmitting(true);
    
    // Store order details in localStorage for the payment page
    const orderDetails = {
      type: 'artwork',
      itemId: artwork?.id,
      title: artwork?.title,
      price: artwork?.price,
      deliveryFee: DELIVERY_FEE,
      totalAmount: artwork ? artwork.price + DELIVERY_FEE : 0,
      ...formData
    };
    
    localStorage.setItem('pendingOrder', JSON.stringify(orderDetails));
    
    // Navigate to payment page
    navigate(`/payment`);
  };

  if (loading) {
    return (
      <div className="py-16 px-4 text-center">
        <h1 className="text-2xl font-semibold mb-4">Loading Artwork...</h1>
        <p className="mb-6">Please wait while we fetch the artwork details.</p>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="py-16 px-4 text-center">
        <h1 className="text-2xl font-semibold mb-4">Artwork Not Found</h1>
        <p className="mb-6">The artwork you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/artworks')}>
          Back to Artworks
        </Button>
      </div>
    );
  }

  // Show sold artwork message
  if (artwork.status === 'sold') {
    return (
      <div className="py-16 px-4 text-center">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <Ban className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold mb-4">Artwork Already Sold</h1>
          <p className="mb-6 text-gray-600">
            This artwork has already been purchased and is no longer available.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/artworks')} className="w-full">
              Browse Other Artworks
            </Button>
            <Button onClick={() => navigate(`/artworks/${id}`)} variant="outline" className="w-full">
              View Artwork Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalAmount = artwork.price + DELIVERY_FEE;

  return (
    <div className="py-12 px-4 md:px-6 bg-secondary min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="mb-8">
              <div className="flex justify-center">
                <div className="flex items-center">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${currentStep >= 1 ? 'bg-gold text-white' : 'bg-gray-200'}`}>
                    {currentStep > 1 ? <Check className="h-5 w-5" /> : 1}
                  </div>
                  <div className={`h-1 w-20 ${currentStep >= 2 ? 'bg-gold' : 'bg-gray-200'}`}></div>
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${currentStep >= 2 ? 'bg-gold text-white' : 'bg-gray-200'}`}>
                    2
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-2">
                <div className="flex text-sm">
                  <div className="w-20 text-center">Delivery</div>
                  <div className="w-20 text-center">Review & Pay</div>
                </div>
              </div>
            </div>
            
            <h1 className="font-serif text-3xl font-bold mb-8 text-center">
              {currentStep === 1 ? "Delivery Information" : "Review & Payment"}
            </h1>
            
            <div className="grid md:grid-cols-[1fr_2fr] gap-8 mb-8">
              <div>
                <div className="sticky top-8">
                  <h3 className="font-medium text-lg mb-4">Order Summary</h3>
                  <div className="bg-secondary rounded-lg p-4 mb-4">
                    <div className="mb-4">
                      <h4 className="font-medium">{artwork.title}</h4>
                      <p className="text-sm text-gray-600">By {artwork.artist}</p>
                      <p className="text-sm text-gray-600 mt-2">{artwork.medium}, {artwork.dimensions}</p>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between mb-1">
                        <span>Artwork:</span>
                        <span>{formatPrice(artwork.price)}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Delivery:</span>
                        <span>{formatPrice(DELIVERY_FEE)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg mt-2">
                        <span>Total:</span>
                        <span>{formatPrice(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                {currentStep === 1 ? (
                  <form onSubmit={handleContinue}>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          readOnly
                          className="bg-gray-100"
                        />
                        <p className="text-sm text-gray-500 mt-1">Name from your account</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          readOnly
                          className="bg-gray-100"
                        />
                        <p className="text-sm text-gray-500 mt-1">Email from your account</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number*</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">Required for delivery coordination</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="deliveryAddress">Delivery Address*</Label>
                        <Textarea
                          id="deliveryAddress"
                          name="deliveryAddress"
                          placeholder="Enter your full delivery address"
                          value={formData.deliveryAddress}
                          onChange={handleInputChange}
                          required
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          placeholder="Any special instructions for delivery"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={2}
                        />
                      </div>
                      
                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          className="w-full bg-gold hover:bg-gold-dark text-white py-6 text-lg"
                        >
                          Continue to Review
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-3">Delivery Information</h3>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="text-gray-600">Name:</div>
                          <div>{formData.name}</div>
                          <div className="text-gray-600">Email:</div>
                          <div>{formData.email}</div>
                          <div className="text-gray-600">Phone:</div>
                          <div>{formData.phone}</div>
                          <div className="text-gray-600">Address:</div>
                          <div>{formData.deliveryAddress}</div>
                          {formData.notes && (
                            <>
                              <div className="text-gray-600">Notes:</div>
                              <div>{formData.notes}</div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-3">Artwork Details</h3>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="text-gray-600">Title:</div>
                          <div>{artwork.title}</div>
                          <div className="text-gray-600">Artist:</div>
                          <div>{artwork.artist}</div>
                          <div className="text-gray-600">Medium:</div>
                          <div>{artwork.medium}</div>
                          <div className="text-gray-600">Size:</div>
                          <div>{artwork.dimensions}</div>
                          <div className="text-gray-600">Price:</div>
                          <div>{formatPrice(artwork.price)}</div>
                          <div className="text-gray-600">Delivery Fee:</div>
                          <div>{formatPrice(DELIVERY_FEE)}</div>
                          <div className="text-gray-600 font-medium">Total:</div>
                          <div className="font-semibold">{formatPrice(totalAmount)}</div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button 
                          type="button"
                          variant="outline"
                          className="w-1/3"
                          onClick={() => setCurrentStep(1)}
                        >
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          className="w-2/3 bg-gold hover:bg-gold-dark text-white py-6 text-lg"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Processing..." : "Continue to Payment"}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkCheckout;

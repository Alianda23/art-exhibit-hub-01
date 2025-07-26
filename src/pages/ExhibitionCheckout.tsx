import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/utils/formatters';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getExhibition } from '@/services/api';
import { Exhibition } from '@/types';
import { Check } from 'lucide-react';

const ExhibitionCheckout = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const slots = parseInt(searchParams.get('slots') || '1');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  useEffect(() => {
    const fetchExhibition = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getExhibition(id);
        setExhibition(data);
        
        // Check if enough slots are available
        if (data.availableSlots < slots) {
          toast({
            title: "Insufficient Slots",
            description: `Only ${data.availableSlots} slots available. Requested ${slots} slots.`,
            variant: "destructive",
          });
          navigate(`/exhibitions/${id}`);
          return;
        }
        
        // Check if exhibition is sold out
        if (data.availableSlots === 0) {
          toast({
            title: "Exhibition Sold Out",
            description: "This exhibition has no available slots remaining.",
            variant: "destructive",
          });
          navigate(`/exhibitions/${id}`);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch exhibition:', error);
        toast({
          title: "Error",
          description: "Failed to load exhibition details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExhibition();
  }, [id, toast, slots, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number for ticket confirmation.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double check slots availability before proceeding
    if (exhibition && exhibition.availableSlots < slots) {
      toast({
        title: "Slots No Longer Available",
        description: `Only ${exhibition.availableSlots} slots remaining. Please adjust your booking.`,
        variant: "destructive",
      });
      navigate(`/exhibitions/${id}`);
      return;
    }
    
    setIsSubmitting(true);
    
    // Store order details in localStorage for the payment page
    const orderDetails = {
      type: 'exhibition',
      itemId: exhibition?.id,
      title: exhibition?.title,
      slots: slots,
      pricePerSlot: exhibition?.ticketPrice,
      totalAmount: exhibition ? exhibition.ticketPrice * slots : 0,
      ...formData
    };
    
    localStorage.setItem('pendingOrder', JSON.stringify(orderDetails));
    
    // Navigate to payment page
    navigate(`/payment`);
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

  const totalAmount = exhibition.ticketPrice * slots;

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
                  <div className="w-20 text-center">Details</div>
                  <div className="w-20 text-center">Review & Pay</div>
                </div>
              </div>
            </div>
            
            <h1 className="font-serif text-3xl font-bold mb-8 text-center">
              {currentStep === 1 ? "Booking Details" : "Review & Payment"}
            </h1>
            
            <div className="grid md:grid-cols-[1fr_2fr] gap-8 mb-8">
              <div>
                <div className="sticky top-8">
                  <h3 className="font-medium text-lg mb-4">Booking Summary</h3>
                  <div className="bg-secondary rounded-lg p-4 mb-4">
                    <div className="mb-4">
                      <h4 className="font-medium">{exhibition.title}</h4>
                      <p className="text-sm text-gray-600">{exhibition.location}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        {new Date(exhibition.startDate).toLocaleDateString()} to {new Date(exhibition.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between mb-1">
                        <span>Tickets:</span>
                        <span>{slots} x {formatPrice(exhibition.ticketPrice)}</span>
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
                        <p className="text-sm text-gray-500 mt-1">Email from your account (ticket will be sent here)</p>
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
                        <p className="text-sm text-gray-500 mt-1">Required for ticket confirmation</p>
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
                        <h3 className="font-medium mb-3">Booking Information</h3>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="text-gray-600">Name:</div>
                          <div>{formData.name}</div>
                          <div className="text-gray-600">Email:</div>
                          <div>{formData.email}</div>
                          <div className="text-gray-600">Phone:</div>
                          <div>{formData.phone}</div>
                          <div className="text-gray-600">Tickets:</div>
                          <div>{slots}</div>
                          <div className="text-gray-600">Total Amount:</div>
                          <div className="font-semibold">{formatPrice(totalAmount)}</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-3">Exhibition Details</h3>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="text-gray-600">Title:</div>
                          <div>{exhibition.title}</div>
                          <div className="text-gray-600">Location:</div>
                          <div>{exhibition.location}</div>
                          <div className="text-gray-600">Dates:</div>
                          <div>{new Date(exhibition.startDate).toLocaleDateString()} - {new Date(exhibition.endDate).toLocaleDateString()}</div>
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

export default ExhibitionCheckout;

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createCancellationRequest } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TicketCancellationFormProps {
  bookingId: string;
  ticketCode: string;
  exhibitionTitle: string;
  onCancel: () => void;
}

const TicketCancellationForm: React.FC<TicketCancellationFormProps> = ({
  bookingId,
  ticketCode,
  exhibitionTitle,
  onCancel
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await createCancellationRequest(bookingId, reason.trim());
      
      if (response.error) {
        toast({
          title: "Cancellation Failed",
          description: response.error,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Cancellation Request Submitted",
        description: "Your refund will be processed within 3 working days.",
        duration: 5000
      });

      // Navigate back to profile or close the form
      navigate('/profile');
      
    } catch (error) {
      console.error('Error submitting cancellation:', error);
      toast({
        title: "Error",
        description: "Failed to submit cancellation request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="mb-6 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl font-serif text-red-600">
              Cancel Ticket & Request Refund
            </CardTitle>
            <CardDescription>
              Please provide a reason for your cancellation request
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Once submitted, your ticket will be immediately cancelled and refunds will be processed within 3 working days.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Ticket Number</Label>
                  <Input 
                    value={ticketCode}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Exhibition</Label>
                  <Input 
                    value={exhibitionTitle}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <Label htmlFor="reason" className="text-sm font-medium text-gray-700">
                    Reason for Cancellation *
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Please explain why you need to cancel this ticket..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Please provide a detailed reason to help us process your refund quickly.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Keep Ticket
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Processing...
                    </>
                  ) : (
                    'Submit Cancellation'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketCancellationForm;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isAdmin, getAllTickets } from '@/services/api';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { createImageSrc, handleImageError, preloadImage } from '@/utils/imageUtils';
import { Search } from 'lucide-react';

interface Ticket {
  id: string;
  user_id: string;
  user_name: string;
  exhibition_id: string;
  exhibition_title: string;
  exhibition_image_url?: string;
  booking_date: string;
  ticket_code: string;
  slots: number;
  status: 'active' | 'used' | 'cancelled';
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
}

const AdminTickets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [generatingTicket, setGeneratingTicket] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/admin-login');
      return;
    }
    
    console.log("Admin tickets page loaded, user is admin");
  }, [navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets'],
    queryFn: getAllTickets,
  });

  // Log tickets data and preload images when data is available
  useEffect(() => {
    console.log("Tickets data:", data);
    if (error) {
      console.error("Error fetching tickets:", error);
    }
    
    // Preload all ticket images when data is available
    if (data?.tickets) {
      data.tickets.forEach((ticket: Ticket) => {
        if (ticket.exhibition_image_url) {
          preloadImage(ticket.exhibition_image_url);
        }
      });
    }
  }, [data, error]);

  const generateTicketPDF = (ticket: Ticket) => {
    try {
      setGeneratingTicket(ticket.id);
      console.log(`Generating ticket for: ${ticket.id}`);
      
      // Create HTML content for the ticket
      const ticketHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Exhibition Ticket</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              background: #f5f5f5;
            }
            .ticket {
              background: white;
              border: 2px solid #333;
              border-radius: 10px;
              padding: 30px;
              max-width: 600px;
              margin: 0 auto;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #333;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .details {
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
              padding: 5px 0;
              border-bottom: 1px solid #eee;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            .value {
              color: #333;
            }
            .ticket-code {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              background: #f0f0f0;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              letter-spacing: 2px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px dashed #333;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="title">EXHIBITION TICKET</div>
              <div>Gallery Management System</div>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">User:</span>
                <span class="value">${ticket.user_name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Exhibition:</span>
                <span class="value">${ticket.exhibition_title}</span>
              </div>
              <div class="detail-row">
                <span class="label">Booking Date:</span>
                <span class="value">${format(new Date(ticket.booking_date), 'MMMM do, yyyy h:mm a')}</span>
              </div>
              <div class="detail-row">
                <span class="label">Slots:</span>
                <span class="value">${ticket.slots}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">${ticket.status.toUpperCase()}</span>
              </div>
            </div>
            
            <div class="ticket-code">
              ${ticket.ticket_code}
            </div>
            
            <div class="footer">
              <p>Please present this ticket at the exhibition entrance</p>
              <p>Generated on ${format(new Date(), 'MMMM do, yyyy h:mm a')}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create a new window and print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(ticketHTML);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
          printWindow.print();
        };
        
        toast({
          title: "Success",
          description: "Ticket opened in new window for printing",
        });
      } else {
        // Fallback: create downloadable HTML file
        const blob = new Blob([ticketHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exhibition-ticket-${ticket.ticket_code}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download Started",
          description: "Ticket downloaded as HTML file",
        });
      }

    } catch (error) {
      console.error("Error generating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to generate ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingTicket(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (error) {
      console.error(`Error formatting date: ${dateString}`, error);
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'used':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Filter tickets based on search term
  const filteredTickets = React.useMemo(() => {
    const tickets = data?.tickets || [];
    if (!searchTerm.trim()) {
      return tickets;
    }
    
    return tickets.filter((ticket: Ticket) => 
      ticket.ticket_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data?.tickets, searchTerm]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Exhibition Tickets</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Exhibition Tickets</h1>
        <div className="flex justify-center items-center h-64">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error loading tickets</p>
            <p>{(error as Error).message || "Unknown error occurred"}</p>
          </div>
        </div>
      </div>
    );
  }

  const tickets = data?.tickets || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Exhibition Tickets</h1>
      
      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Tickets ({filteredTickets.length})</h2>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by ticket code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {filteredTickets.length === 0 ? (
            <p className="text-gray-500 p-4 text-center">
              {searchTerm.trim() ? 'No tickets found matching your search' : 'No tickets to display'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Exhibition</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket: Ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>{ticket.user_name}</TableCell>
                      <TableCell>{ticket.exhibition_title}</TableCell>
                      <TableCell>{format(new Date(ticket.booking_date), 'PPP p')}</TableCell>
                      <TableCell>
                        <Badge className={ticket.status === 'active' ? 'bg-green-500' : ticket.status === 'used' ? 'bg-yellow-500' : 'bg-red-500'}>
                          {ticket.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                            onClick={() => generateTicketPDF(ticket)}
                            disabled={generatingTicket === ticket.id}
                          >
                            {generatingTicket === ticket.id ? 'Generating...' : 'Print'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
        
        <Card className="p-4">
          {selectedTicket ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Ticket Details</h2>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                  onClick={() => generateTicketPDF(selectedTicket)}
                  disabled={generatingTicket === selectedTicket.id}
                >
                  {generatingTicket === selectedTicket.id ? 'Generating...' : 'Print Ticket'}
                </Button>
              </div>
              
              <div className="space-y-4">
                {selectedTicket.exhibition_image_url && (
                  <div className="mb-4">
                    <img 
                      src={createImageSrc(selectedTicket.exhibition_image_url)} 
                      alt={selectedTicket.exhibition_title} 
                      className="w-full h-48 object-cover rounded-md"
                      onError={(e) => {
                        console.error(`Failed to load image: ${selectedTicket.exhibition_image_url}`);
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">User:</p>
                    <p className="font-medium">{selectedTicket.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Exhibition:</p>
                    <p className="font-medium">{selectedTicket.exhibition_title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Booking Date:</p>
                    <p>{format(new Date(selectedTicket.booking_date), 'PPP p')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Slots:</p>
                    <p>{selectedTicket.slots}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ticket Code:</p>
                    <p className="font-mono bg-gray-100 px-2 py-1 rounded">{selectedTicket.ticket_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status:</p>
                    <Badge className={selectedTicket.status === 'active' ? 'bg-green-500' : selectedTicket.status === 'used' ? 'bg-yellow-500' : 'bg-red-500'}>
                      {selectedTicket.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500">Select a ticket to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminTickets;

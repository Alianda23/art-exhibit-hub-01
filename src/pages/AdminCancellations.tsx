
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAdmin, getAllCancellationRequests, updateCancellationStatus } from '@/services/api';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { formatPrice } from '@/utils/formatters';
import { Search, Eye, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';

interface CancellationRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  booking_id: string;
  ticket_code: string;
  exhibition_title: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  refund_amount: number;
  created_at: string;
  processed_at?: string;
  processed_by?: string;
  admin_notes?: string;
  booking_date: string;
  slots: number;
  location: string;
  start_date: string;
  end_date: string;
}

const AdminCancellations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    console.log('=== AdminCancellations useEffect ===');
    console.log('isAdmin():', isAdmin());
    console.log('localStorage isAdmin:', localStorage.getItem('isAdmin'));
    console.log('Token exists:', !!localStorage.getItem('token'));
    console.log('Current path:', window.location.pathname);
    
    // Don't redirect if we're already on admin login page
    if (!isAdmin() && !window.location.pathname.includes('admin-login')) {
      console.log('Not admin, redirecting to login');
      navigate('/admin-login');
      return;
    }
  }, [navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cancellation-requests'],
    queryFn: async () => {
      console.log('Starting to fetch cancellation requests...');
      const result = await getAllCancellationRequests();
      console.log('Fetched cancellation requests result:', result);
      return result;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      updateCancellationStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancellation-requests'] });
      toast({
        title: "Success",
        description: "Cancellation status updated successfully",
      });
      setIsDialogOpen(false);
      setNewStatus('');
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (request: CancellationRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setAdminNotes(request.admin_notes || '');
    setIsDialogOpen(true);
  };

  const handleSubmitStatusUpdate = () => {
    if (!selectedRequest || !newStatus) return;

    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status: newStatus,
      notes: adminNotes
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-blue-500';
      case 'rejected':
        return 'bg-red-500';
      case 'processed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'processed':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Filter requests based on search term and status
  const filteredRequests = React.useMemo(() => {
    const requests = data?.cancellations || [];
    let filtered = requests;

    if (searchTerm.trim()) {
      filtered = filtered.filter((request: CancellationRequest) => 
        request.ticket_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.exhibition_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((request: CancellationRequest) => 
        request.status === statusFilter
      );
    }

    return filtered;
  }, [data?.cancellations, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Ticket Cancellations & Refunds</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading cancellation requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Ticket Cancellations & Refunds</h1>
        <div className="flex justify-center items-center h-64">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error loading cancellation requests</p>
            <p>{(error as Error).message || "Unknown error occurred"}</p>
          </div>
        </div>
      </div>
    );
  }

  const requests = data?.cancellations || [];
  console.log('Cancellation requests data:', requests);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ticket Cancellations & Refunds</h1>
        <div className="text-sm text-gray-600">
          Total Requests: {filteredRequests.length}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter((r: CancellationRequest) => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600">
                  {requests.filter((r: CancellationRequest) => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter((r: CancellationRequest) => r.status === 'processed').length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Refunds</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatPrice(
                    requests
                      .filter((r: CancellationRequest) => r.status === 'processed')
                      .reduce((sum: number, r: CancellationRequest) => sum + r.refund_amount, 0)
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cancellation Requests</CardTitle>
          <CardDescription>
            Manage ticket cancellation and refund requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by ticket code, user name, or exhibition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {searchTerm.trim() || statusFilter !== 'all' 
                  ? 'No cancellation requests found matching your criteria' 
                  : 'No cancellation requests to display'}
              </p>
              {requests.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                  <p><strong>Debug Info:</strong></p>
                  <p>Raw data: {JSON.stringify(data)}</p>
                  <p>Requests array length: {requests.length}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket Code</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Exhibition</TableHead>
                    <TableHead>Refund Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request: CancellationRequest) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm">
                        {request.ticket_code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.user_name}</div>
                          <div className="text-sm text-gray-500">{request.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {request.exhibition_title}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(request.refund_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(request.status)} text-white flex items-center gap-1 w-fit`}>
                          {getStatusIcon(request.status)}
                          {request.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Cancellation Request Details</DialogTitle>
                                <DialogDescription>
                                  Review the full details of this cancellation request
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Ticket Code</Label>
                                    <p className="font-mono">{request.ticket_code}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Badge className={`${getStatusColor(request.status)} text-white flex items-center gap-1 w-fit mt-1`}>
                                      {getStatusIcon(request.status)}
                                      {request.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">User</Label>
                                    <p>{request.user_name}</p>
                                    <p className="text-sm text-gray-500">{request.user_email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Refund Amount</Label>
                                    <p className="font-medium text-lg">{formatPrice(request.refund_amount)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Exhibition</Label>
                                    <p>{request.exhibition_title}</p>
                                    <p className="text-sm text-gray-500">{request.location}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Booking Date</Label>
                                    <p>{format(new Date(request.booking_date), 'PPP')}</p>
                                    <p className="text-sm text-gray-500">{request.slots} slot(s)</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">Cancellation Reason</Label>
                                  <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{request.reason}</p>
                                </div>
                                
                                {request.admin_notes && (
                                  <div>
                                    <Label className="text-sm font-medium">Admin Notes</Label>
                                    <p className="mt-1 p-3 bg-blue-50 rounded text-sm">{request.admin_notes}</p>
                                  </div>
                                )}
                                
                                <div className="flex justify-between text-sm text-gray-500">
                                  <span>Requested: {format(new Date(request.created_at), 'PPP p')}</span>
                                  {request.processed_at && (
                                    <span>Processed: {format(new Date(request.processed_at), 'PPP p')}</span>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusUpdate(request)}
                            disabled={request.status === 'processed'}
                          >
                            {request.status === 'pending' ? 'Approve/Reject' : 'Update Status'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Cancellation Status</DialogTitle>
            <DialogDescription>
              Change the status of this cancellation request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Ticket Code</Label>
                <p className="font-mono">{selectedRequest.ticket_code}</p>
              </div>
              
              <div>
                <Label htmlFor="status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this decision..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitStatusUpdate}
                  disabled={updateStatusMutation.isPending || !newStatus}
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCancellations;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { isAdmin, getToken, authFetch } from '@/services/api';

interface Order {
  id: string;
  user_id: string;
  user_name: string;
  type: 'artwork' | 'exhibition';
  reference_id: string;
  item_title: string;
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
  order_date: string;
  artwork_id?: string;
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/admin-login');
      return;
    }
  }, [navigate]);

  // Fetch orders from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        const response = await authFetch('/orders');
        console.log('Orders response:', response);
        return response;
      } catch (err) {
        console.error('Error fetching orders:', err);
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
        });
        throw err;
      }
    },
  });

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (error) {
      console.error(`Error formatting date: ${dateString}`, error);
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Orders Management</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Orders Management</h1>
        <div className="flex justify-center items-center h-64">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error loading orders</p>
            <p>{(error as Error).message || "Unknown error occurred"}</p>
          </div>
        </div>
      </div>
    );
  }

  const orders = data?.orders || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>
      
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">All Orders ({orders.length})</h2>
          
          {orders.length === 0 ? (
            <p className="text-gray-500 p-4 text-center">No orders to display</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.id}</TableCell>
                      <TableCell>{order.user_name || 'N/A'}</TableCell>
                      <TableCell>{order.type || 'artwork'}</TableCell>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell>KSh {order.total_amount?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.payment_status || 'pending')}>
                          {(order.payment_status || 'pending').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
        
        <Card className="p-4">
          {selectedOrder ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Order Details</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">Order ID:</p>
                    <p className="font-mono">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date:</p>
                    <p>{formatDate(selectedOrder.order_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer:</p>
                    <p className="font-medium">{selectedOrder.user_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type:</p>
                    <p>{selectedOrder.type || 'artwork'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Item:</p>
                    <p>{selectedOrder.item_title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount:</p>
                    <p className="font-medium">KSh {selectedOrder.total_amount?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Status:</p>
                    <Badge className={getStatusColor(selectedOrder.payment_status || 'pending')}>
                      {(selectedOrder.payment_status || 'pending').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reference ID:</p>
                    <p className="font-mono text-sm">{selectedOrder.reference_id || selectedOrder.artwork_id || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    Download Invoice
                  </Button>
                  {selectedOrder.payment_status === 'pending' && (
                    <Button size="sm">
                      Mark as Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500">Select an order to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminOrders;

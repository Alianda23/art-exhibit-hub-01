
import React, { useEffect, useState } from 'react';
import ArtistLayout from '@/components/ArtistLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getArtistArtworks, getArtistOrders } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingBag, Image } from 'lucide-react';

interface ArtistStats {
  totalArtworks: number;
  availableArtworks: number;
  soldArtworks: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

const Artist = () => {
  const [stats, setStats] = useState<ArtistStats>({
    totalArtworks: 0,
    availableArtworks: 0,
    soldArtworks: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch artworks and orders
        const artworksResponse = await getArtistArtworks();
        const ordersResponse = await getArtistOrders();
        
        // Calculate stats
        const artworks = artworksResponse.artworks || [];
        const orders = ordersResponse.orders || [];
        
        const availableArtworks = artworks.filter(a => a.status === 'available').length;
        const soldArtworks = artworks.filter(a => a.status === 'sold').length;
        const pendingOrders = orders.filter(o => o.payment_status === 'pending').length;
        const completedOrders = orders.filter(o => o.payment_status === 'completed').length;
        
        setStats({
          totalArtworks: artworks.length,
          availableArtworks,
          soldArtworks,
          totalOrders: orders.length,
          pendingOrders,
          completedOrders
        });
        
      } catch (error) {
        console.error("Error fetching artist data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  if (loading) {
    return (
      <ArtistLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ArtistLayout>
    );
  }

  return (
    <ArtistLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Artist Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Artwork Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Image className="h-8 w-8 text-primary mr-4" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalArtworks}</div>
                  <div className="text-xs text-muted-foreground">Total Artworks</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="text-lg font-medium">{stats.availableArtworks}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-lg font-medium">{stats.soldArtworks}</div>
                  <div className="text-xs text-muted-foreground">Sold</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Order Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ShoppingBag className="h-8 w-8 text-primary mr-4" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <div className="text-xs text-muted-foreground">Total Orders</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-amber-50 p-3 rounded-md">
                  <div className="text-lg font-medium">{stats.pendingOrders}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="text-lg font-medium">{stats.completedOrders}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.totalOrders > 0 ? (
                  <>
                    <div className="text-sm">
                      Your artworks have received {stats.totalOrders} orders.
                    </div>
                    <div className="text-sm">
                      {stats.pendingOrders} orders are pending payment.
                    </div>
                    <div className="text-sm">
                      {stats.completedOrders} orders have been completed.
                    </div>
                  </>
                ) : (
                  <div className="text-sm">
                    No orders have been placed for your artworks yet.
                  </div>
                )}
                
                <div className="text-sm mt-2">
                  You have {stats.totalArtworks} artworks in your portfolio.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ArtistLayout>
  );
};

export default Artist;

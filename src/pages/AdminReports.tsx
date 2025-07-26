
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DateRangePicker } from "@/components/DateRangePicker";
import { FileText, Download, TrendingUp, Users, Calendar, ShoppingBag, Ticket, BarChart3, PieChart, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getAllArtworks, getAllExhibitions, getAllTickets, getAllOrders, getAllArtists, authFetch, isAdmin } from '@/services/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatPrice } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

const AdminReports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  
  // Check admin permissions
  useEffect(() => {
    if (!isAdmin()) {
      toast({
        title: "Access Denied",
        description: "You must be logged in as an admin to view reports.",
        variant: "destructive",
      });
      navigate('/admin-login');
      return;
    }
  }, [navigate, toast]);
  

  // Fetch data for reports
  const { data: artworks } = useQuery({
    queryKey: ['artworks'],
    queryFn: getAllArtworks,
  });

  const { data: exhibitions } = useQuery({
    queryKey: ['exhibitions'],
    queryFn: getAllExhibitions,
  });

  const { data: ticketsData } = useQuery({
    queryKey: ['tickets'],
    queryFn: getAllTickets,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        // Try to get orders from the admin endpoint first
        const adminResponse = await getAllOrders();
        console.log('Admin orders response:', adminResponse);
        
        // If admin endpoint doesn't return orders, try to aggregate from all artists
        if (!adminResponse?.orders || adminResponse.orders.length === 0) {
          console.log('Admin orders empty, trying to fetch all artist orders...');
          
          // Get all artists first
          const artistsResponse = await getAllArtists();
          console.log('Artists response:', artistsResponse);
          
          if (artistsResponse?.artists && artistsResponse.artists.length > 0) {
            // For each artist, get their orders and aggregate them
            const allOrders: any[] = [];
            
            for (const artist of artistsResponse.artists) {
              try {
                // Note: This would require a way to get orders for specific artist
                // For now, let's use the admin endpoint but log more details
                console.log('Processing artist:', artist);
              } catch (error) {
                console.error('Error fetching orders for artist:', artist, error);
              }
            }
          }
        }
        
        return adminResponse;
      } catch (error) {
        console.error('Error fetching orders:', error);
        return { orders: [], error: error.message };
      }
    },
  });

  const { data: artistsData } = useQuery({
    queryKey: ['artists'],
    queryFn: async () => {
      const response = await getAllArtists();
      console.log('Artists API response:', response);
      return response?.artists || [];
    },
  });


  // Filter data based on date range
  const filteredOrders = useMemo(() => {
    console.log('Filtering orders. ordersData:', ordersData);
    if (!ordersData || !ordersData.orders || ordersData.error) {
      console.log('No orders data found or error:', ordersData?.error);
      return [];
    }
    const filtered = ordersData.orders.filter((order: any) => {
      const orderDate = new Date(order.order_date);
      if (fromDate && orderDate < fromDate) return false;
      if (toDate && orderDate > toDate) return false;
      return true;
    });
    console.log('Filtered orders:', filtered);
    return filtered;
  }, [ordersData, fromDate, toDate]);

  // Filter tickets based on date range
  const filteredTickets = useMemo(() => {
    console.log('Filtering tickets. ticketsData:', ticketsData);
    if (!ticketsData || !ticketsData.tickets || ticketsData.error) {
      console.log('No tickets data found or error:', ticketsData?.error);
      return [];
    }
    const filtered = ticketsData.tickets.filter((ticket: any) => {
      const ticketDate = new Date(ticket.booking_date);
      if (fromDate && ticketDate < fromDate) return false;
      if (toDate && ticketDate > toDate) return false;
      return true;
    });
    console.log('Filtered tickets:', filtered);
    return filtered;
  }, [ticketsData, fromDate, toDate]);

  // Debug logging after data is ready
  console.log('=== REPORTS DEBUG INFO ===');
  console.log('artworks:', artworks);
  console.log('exhibitions:', exhibitions);
  console.log('ticketsData:', ticketsData);
  console.log('ordersData:', ordersData);
  console.log('artistsData:', artistsData);
  console.log('filtered orders:', filteredOrders);
  console.log('filtered tickets:', filteredTickets);
  console.log('=== END DEBUG INFO ===');

  // Calculate monthly sales data (including both orders and tickets)
  const monthlySalesData = useMemo(() => {
    console.log('Calculating monthly sales. Orders:', filteredOrders.length, 'Tickets:', filteredTickets.length);
    const monthlyData: { [key: string]: { month: string; sales: number; count: number } } = {};
    
    // Add artwork orders
    filteredOrders.forEach((order: any) => {
      console.log('Processing order:', order);
      if (order.payment_status === 'completed') {
        const monthKey = format(new Date(order.order_date), 'yyyy-MM');
        const monthLabel = format(new Date(order.order_date), 'MMM yyyy');
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthLabel, sales: 0, count: 0 };
        }
        monthlyData[monthKey].sales += Number(order.total_amount) || 0;
        monthlyData[monthKey].count += 1;
      }
    });

    // Add ticket sales  
    filteredTickets.forEach((ticket: any) => {
      console.log('Processing ticket:', ticket);
      const monthKey = format(new Date(ticket.booking_date), 'yyyy-MM');
      const monthLabel = format(new Date(ticket.booking_date), 'MMM yyyy');
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, sales: 0, count: 0 };
      }
      monthlyData[monthKey].sales += Number(ticket.total_amount) || 0;
      monthlyData[monthKey].count += 1;
    });
    
    const result = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    console.log('Monthly sales data result:', result);
    return result;
  }, [filteredOrders, filteredTickets]);

  // Calculate artist sales data - simplified approach
  const artistSalesData = useMemo(() => {
    console.log('=== CALCULATING ARTIST SALES (SIMPLIFIED) ===');
    console.log('Raw ordersData:', ordersData);
    console.log('Filtered Orders count:', filteredOrders.length);
    
    if (!filteredOrders || filteredOrders.length === 0) {
      console.log('No orders data available');
      return [];
    }
    
    const artistData: { [key: string]: { totalSales: number; totalOrders: number; monthlyBreakdown: { [month: string]: number } } } = {};
    
    // Process all orders directly
    filteredOrders.forEach((order: any, index: number) => {
      console.log(`Processing order ${index}:`, {
        id: order.id,
        payment_status: order.payment_status,
        artist: order.artist,
        artist_name: order.artist_name,
        item_title: order.item_title,
        total_amount: order.total_amount,
        order_date: order.order_date
      });
      
      if (order.payment_status === 'completed') {
        // Get artist name from order directly (most reliable)
        let artistName = order.artist || order.artist_name;
        
        // If no direct artist field, try to extract from item title or other fields
        if (!artistName && order.item_title) {
          // Try to find artist from artworks if available
          if (artworks && artworks.length > 0) {
            const matchedArtwork = artworks.find((art: any) => 
              art.title === order.item_title ||
              order.item_title.includes(art.title) ||
              art.title.includes(order.item_title)
            );
            if (matchedArtwork) {
              artistName = matchedArtwork.artist;
              console.log(`Found artist via artwork match: ${artistName}`);
            }
          }
        }
        
        // Default artist name if still not found
        if (!artistName) {
          artistName = 'Unknown Artist';
          console.log('Using Unknown Artist for order:', order.id);
        }
        
        if (!artistData[artistName]) {
          console.log(`Creating new artist entry for: ${artistName}`);
          artistData[artistName] = {
            totalSales: 0,
            totalOrders: 0,
            monthlyBreakdown: {}
          };
        }
        
        const monthKey = format(new Date(order.order_date), 'MMM yyyy');
        const amount = Number(order.total_amount) || 0;
        
        console.log(`Adding ${amount} to ${artistName} for ${monthKey}`);
        
        artistData[artistName].totalSales += amount;
        artistData[artistName].totalOrders += 1;
        artistData[artistName].monthlyBreakdown[monthKey] = 
          (artistData[artistName].monthlyBreakdown[monthKey] || 0) + amount;
      }
    });
    
    const result = Object.entries(artistData).map(([artist, data]) => ({
      artist,
      totalSales: data.totalSales,
      totalOrders: data.totalOrders,
      monthlyBreakdown: data.monthlyBreakdown,
    })).sort((a, b) => b.totalSales - a.totalSales);
    
    console.log('Final artist sales data:', result);
    console.log('=== END ARTIST SALES CALCULATION ===');
    return result;
  }, [filteredOrders, artworks]);

  // Find highest selling month
  const highestSellingMonth = useMemo(() => {
    if (!monthlySalesData.length) return null;
    return monthlySalesData.reduce((prev, current) => 
      current.sales > prev.sales ? current : prev
    );
  }, [monthlySalesData]);

  // Chart colors
  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  const generateCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header.toLowerCase().replace(' ', '_')] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const generateReport = async (reportType: string) => {
    setGeneratingReport(reportType);
    
    try {
      switch (reportType) {
        case 'sales':
          const salesData = filteredOrders.map((order: any) => ({
            order_id: order.id,
            customer_name: order.user_name,
            item_title: order.item_title,
            total_amount: order.total_amount,
            payment_status: order.payment_status,
            order_date: format(new Date(order.order_date), 'yyyy-MM-dd'),
          }));
          generateCSV(salesData, 'sales_report', ['Order ID', 'Customer Name', 'Item Title', 'Total Amount', 'Payment Status', 'Order Date']);
          break;

        case 'artworks':
          const artworkData = artworks?.map((artwork: any) => ({
            title: artwork.title,
            artist_name: artwork.artist,
            medium: artwork.medium,
            price: artwork.price,
            available: artwork.status === 'available' ? 'Yes' : 'No',
            created_at: artwork.created_at ? format(new Date(artwork.created_at), 'yyyy-MM-dd') : 'N/A',
          })) || [];
          generateCSV(artworkData, 'artworks_report', ['Title', 'Artist Name', 'Medium', 'Price', 'Available', 'Created At']);
          break;

        case 'exhibitions':
          const exhibitionData = exhibitions?.map((exhibition: any) => ({
            title: exhibition.title,
            location: exhibition.location,
            start_date: format(new Date(exhibition.startDate), 'yyyy-MM-dd'),
            end_date: format(new Date(exhibition.endDate), 'yyyy-MM-dd'),
            status: exhibition.status,
            ticket_price: exhibition.ticketPrice,
          })) || [];
          generateCSV(exhibitionData, 'exhibitions_report', ['Title', 'Location', 'Start Date', 'End Date', 'Status', 'Ticket Price']);
          break;

        case 'tickets':
          const ticketData = ticketsData?.tickets?.map((ticket: any) => ({
            user_name: ticket.user_name,
            exhibition_title: ticket.exhibition_title,
            booking_date: format(new Date(ticket.booking_date), 'yyyy-MM-dd'),
            slots: ticket.slots,
            status: ticket.status,
            total_amount: ticket.total_amount,
          })) || [];
          generateCSV(ticketData, 'tickets_report', ['User Name', 'Exhibition Title', 'Booking Date', 'Slots', 'Status', 'Total Amount']);
          break;

        case 'financial':
          const totalSales = filteredOrders.reduce((sum: number, order: any) => 
            order.payment_status === 'completed' ? sum + (order.total_amount || 0) : sum, 0);
          const totalTickets = filteredTickets.reduce((sum: number, ticket: any) => 
            sum + (ticket.total_amount || 0), 0);
          
          const financialData = [
            {
              category: 'Artwork Sales',
              total_revenue: totalSales,
              count: filteredOrders.filter((o: any) => o.payment_status === 'completed').length,
              report_date: format(new Date(), 'yyyy-MM-dd'),
            },
            {
              category: 'Exhibition Tickets',
              total_revenue: totalTickets,
              count: ticketsData?.tickets?.length || 0,
              report_date: format(new Date(), 'yyyy-MM-dd'),
            },
            {
              category: 'Total Revenue',
              total_revenue: totalSales + totalTickets,
              count: filteredOrders.length + (ticketsData?.tickets?.length || 0),
              report_date: format(new Date(), 'yyyy-MM-dd'),
            }
          ];
          generateCSV(financialData, 'financial_report', ['Category', 'Total Revenue', 'Count', 'Report Date']);
          break;

        case 'artist-monthly-sales':
          await generatePDF('artist-monthly-chart', 'artist_monthly_sales_report');
          break;

        case 'monthly-analysis':
          await generatePDF('monthly-analysis-chart', 'monthly_sales_analysis_report');
          break;

        default:
          break;
      }

      toast({
        title: "Success",
        description: "Report generated and downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const chartConfig = {
    sales: {
      label: "Sales",
      color: "hsl(var(--chart-1))",
    },
    count: {
      label: "Count",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Advanced Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate parameterized reports with visual analytics</p>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
          <TabsTrigger value="monthly-sales">Monthly Sales</TabsTrigger>
          <TabsTrigger value="artist-reports">Artist Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <DateRangePicker
                  fromDate={fromDate}
                  toDate={toDate}
                  onFromDateChange={setFromDate}
                  onToDateChange={setToDate}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(
                    artistSalesData.reduce((sum, artist) => sum + artist.totalSales, 0) +
                    filteredTickets.reduce((sum, ticket) => sum + (ticket.total_amount || 0), 0)
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {artistSalesData.reduce((sum, artist) => sum + artist.totalOrders, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-primary">
                  {highestSellingMonth ? `${highestSellingMonth.month} (${formatPrice(highestSellingMonth.sales)})` : 'No data'}
                </div>
                <p className="text-sm text-muted-foreground">Best Month</p>
              </Card>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="monthly-sales" className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Monthly Sales Analysis</h2>
              <Button 
                onClick={() => generateReport('monthly-analysis')}
                disabled={generatingReport === 'monthly-analysis'}
                className="flex items-center gap-2"
              >
                {generatingReport === 'monthly-analysis' ? (
                  "Generating..."
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>

            <div id="monthly-analysis-chart" className="bg-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Monthly Sales Trend</h3>
              {monthlySalesData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="sales" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No sales data available for the selected period
                </div>
              )}
              
              {highestSellingMonth && (
                <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold text-primary">Highest Selling Month</h4>
                  <p className="text-sm text-muted-foreground">
                    {highestSellingMonth.month} with {formatPrice(highestSellingMonth.sales)} 
                    from {highestSellingMonth.count} orders
                  </p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="artist-reports" className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Artist Monthly Sales</h2>
              <Button 
                onClick={() => generateReport('artist-monthly-sales')}
                disabled={generatingReport === 'artist-monthly-sales'}
                className="flex items-center gap-2"
              >
                {generatingReport === 'artist-monthly-sales' ? (
                  "Generating..."
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>

            <div id="artist-monthly-chart" className="bg-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Artist Performance</h3>
              {artistSalesData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={artistSalesData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="artist" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="totalSales" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No artist sales data available for the selected period
                </div>
              )}
              
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Artist Sales Report</h4>
                <div className="space-y-4">
                  {artistSalesData.map((artist, index) => (
                    <Card key={artist.artist} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-lg">{artist.artist}</h5>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Sales</p>
                              <p className="font-bold text-primary">{formatPrice(artist.totalSales)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Orders</p>
                              <p className="font-bold">{artist.totalOrders}</p>
                            </div>
                          </div>
                          {Object.keys(artist.monthlyBreakdown).length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground mb-2">Monthly Breakdown:</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(artist.monthlyBreakdown).map(([month, amount]) => (
                                  <Badge key={month} variant="secondary" className="text-xs">
                                    {month}: {formatPrice(amount)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  {artistSalesData.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No artist sales data available for the selected period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Legacy Reports Section */}
      <Card className="p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">Standard Reports (CSV)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button 
            onClick={() => generateReport('sales')}
            disabled={generatingReport === 'sales'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            Sales Report
          </Button>
          <Button 
            onClick={() => generateReport('artworks')}
            disabled={generatingReport === 'artworks'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Artworks Report
          </Button>
          <Button 
            onClick={() => generateReport('exhibitions')}
            disabled={generatingReport === 'exhibitions'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Exhibitions Report
          </Button>
          <Button 
            onClick={() => generateReport('tickets')}
            disabled={generatingReport === 'tickets'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Ticket className="h-4 w-4" />
            Tickets Report
          </Button>
          <Button 
            onClick={() => generateReport('financial')}
            disabled={generatingReport === 'financial'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Financial Report
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminReports;

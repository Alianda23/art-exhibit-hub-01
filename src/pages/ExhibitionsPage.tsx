
import React, { useState, useEffect } from 'react';
import ExhibitionCard from '@/components/ExhibitionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Exhibition } from '@/types';
import { getAllExhibitions } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ExhibitionsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchExhibitions = async () => {
      try {
        setLoading(true);
        const data = await getAllExhibitions();
        setExhibitions(data);
      } catch (error) {
        console.error('Failed to fetch exhibitions:', error);
        toast({
          title: "Error",
          description: "Failed to load exhibitions. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchExhibitions();
  }, [toast]);

  // Filter exhibitions based on search term and status filter
  const filteredExhibitions = exhibitions.filter((exhibition) => {
    const matchesSearch = 
      exhibition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibition.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibition.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || exhibition.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="py-12 px-4 md:px-6 bg-secondary min-h-screen">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold mb-4">
            Upcoming <span className="text-gold">Exhibitions</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover and book tickets for art exhibitions across Kenya
          </p>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-10">
          <div className="grid md:grid-cols-[1fr_2fr] gap-6">
            <div>
              <Label htmlFor="status" className="text-lg font-medium mb-3 block">Exhibition Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exhibitions</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <div className="relative w-full">
                <Label htmlFor="search" className="text-lg font-medium mb-3 block">Search</Label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Search by title, location, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            {loading ? "Loading exhibitions..." : `Showing ${filteredExhibitions.length} exhibitions`}
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-medium mb-2">Loading exhibitions...</h3>
            <p className="text-gray-600">Please wait while we fetch the exhibitions</p>
          </div>
        ) : filteredExhibitions.length > 0 ? (
          <div className="exhibition-grid">
            {filteredExhibitions.map((exhibition) => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-medium mb-2">No exhibitions found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExhibitionsPage;

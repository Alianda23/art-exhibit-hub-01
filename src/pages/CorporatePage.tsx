
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArtworkCard from '@/components/ArtworkCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { formatPrice } from '@/utils/formatters';
import { Search, Building, Users, Palette, Award, Mail, Phone, MapPin } from 'lucide-react';
import { getAllArtworks } from '@/services/api';
import { Artwork } from '@/types';
import { useToast } from '@/hooks/use-toast';

const CorporatePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const minPrice = 0;
  const maxPrice = 100000;

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        setLoading(true);
        const data = await getAllArtworks();
        setArtworks(data);
      } catch (error) {
        console.error('Failed to fetch artworks:', error);
        toast({
          title: "Error",
          description: "Failed to load artworks. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchArtworks();
  }, [toast]);

  // Filter artworks based on search term and price range
  const filteredArtworks = artworks.filter((artwork) => {
    const matchesSearch = 
      artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artwork.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artwork.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrice = artwork.price >= priceRange[0] && artwork.price <= priceRange[1];
    
    return matchesSearch && matchesPrice && artwork.status === 'available';
  });

  return (
    <div className="min-h-screen bg-secondary">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Building className="h-16 w-16 text-gold" />
          </div>
          <h1 className="text-5xl font-serif font-bold mb-6">
            Corporate Art Solutions
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Transform your corporate spaces with curated artworks from Nairobi's finest artists. 
            Perfect for galleries, hotels, offices, and cultural institutions.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Award className="h-4 w-4 mr-2" />
              Curated Collection
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Users className="h-4 w-4 mr-2" />
              Bulk Discounts Available
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Palette className="h-4 w-4 mr-2" />
              Professional Installation
            </Badge>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">Our Corporate Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive art solutions tailored for institutional clients
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center">
              <CardHeader>
                <Building className="h-12 w-12 text-gold mx-auto mb-4" />
                <CardTitle>Gallery Partnerships</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Exclusive partnerships with galleries for rotating exhibitions and permanent collections.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-gold mx-auto mb-4" />
                <CardTitle>Corporate Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Curated artwork collections for corporate offices, hotels, and public spaces.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Award className="h-12 w-12 text-gold mx-auto mb-4" />
                <CardTitle>Art Consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Professional art consultation services to help you select the perfect pieces for your space.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Artwork Collection */}
      <div className="py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">
              Featured <span className="text-gold">Artwork</span> Collection
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Browse our carefully selected artworks perfect for corporate and institutional spaces
            </p>
          </div>
          
          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-10">
            <div className="grid md:grid-cols-[1fr_2fr] gap-6">
              <div>
                <Label htmlFor="corporate-price-range" className="text-lg font-medium mb-3 block">Price Range</Label>
                <div className="px-2">
                  <Slider
                    id="corporate-price-range"
                    defaultValue={[minPrice, maxPrice]}
                    max={maxPrice}
                    min={minPrice}
                    step={1000}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="my-4"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
              
              <div className="flex items-end">
                <div className="relative w-full">
                  <Label htmlFor="corporate-search" className="text-lg font-medium mb-3 block">Search Artworks</Label>
                  <div className="relative">
                    <Input
                      id="corporate-search"
                      placeholder="Search by title, artist, or description..."
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
              {loading ? "Loading artworks..." : `Showing ${filteredArtworks.length} available artworks`}
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-16">
              <h3 className="text-2xl font-medium mb-2">Loading artworks...</h3>
              <p className="text-gray-600">Please wait while we fetch the collection</p>
            </div>
          ) : filteredArtworks.length > 0 ? (
            <div className="artwork-grid">
              {filteredArtworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-2xl font-medium mb-2">No artworks found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to transform your space? Contact our corporate art specialists today.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Corporate Art Specialists</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gold mr-3" />
                  <span>corporate@artgallerynairobi.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gold mr-3" />
                  <span>+254 700 123 456</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gold mr-3" />
                  <span>Art Gallery Nairobi, Kenya</span>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="font-semibold mb-4">Services Include:</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Volume discount pricing</li>
                  <li>• Professional installation services</li>
                  <li>• Custom framing options</li>
                  <li>• Art consultation and curation</li>
                  <li>• Flexible payment terms</li>
                  <li>• Insurance and certification</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Request a Consultation</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company">Institution/Company Name</Label>
                  <Input id="company" placeholder="Your institution name" />
                </div>
                <div>
                  <Label htmlFor="contact-name">Contact Person</Label>
                  <Input id="contact-name" placeholder="Your full name" />
                </div>
                <div>
                  <Label htmlFor="contact-email">Email</Label>
                  <Input id="contact-email" type="email" placeholder="your@email.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="+254 700 000 000" />
                </div>
                <Button className="w-full bg-gold hover:bg-gold-dark text-white">
                  Request Consultation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Ready to Enhance Your Space?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Browse our full collection or contact us for personalized recommendations
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/artworks">
              <Button size="lg" className="bg-gold hover:bg-gold-dark text-white">
                Browse All Artworks
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporatePage;

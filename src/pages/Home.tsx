import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDateRange } from '@/utils/formatters';
import ArtworkRecommendations from '@/components/ArtworkRecommendations';
import ExhibitionCard from '@/components/ExhibitionCard';
import { getAllExhibitions } from '@/services/api';
import { Exhibition } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Home = () => {
  const [featuredExhibitions, setFeaturedExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const aboutRef = useRef<HTMLDivElement>(null);
  const artworksRef = useRef<HTMLDivElement>(null);
  const exhibitionsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const exhibitionsData = await getAllExhibitions();
        
        // Get first 3 exhibitions
        setFeaturedExhibitions(exhibitionsData.slice(0, 2));
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: "Error",
          description: "Failed to load featured items. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1594122230689-45899d9e6f69?q=80&w=1000')",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-6">
              Discover the Finest <span className="text-gold">Kenyan Art</span> & Exhibitions
            </h1>
            <p className="text-xl text-white mb-8">
              Explore unique artworks by talented Kenyan artists and attend exclusive exhibitions in Nairobi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => scrollToSection(artworksRef)} className="bg-gold hover:bg-gold-dark text-white px-8 py-6 text-lg">
                Explore Artworks
              </Button>
              <Button onClick={() => scrollToSection(exhibitionsRef)} variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black px-8 py-6 text-lg">
                View Exhibitions
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 w-full flex justify-center">
          <Button
            variant="ghost"
            onClick={() => scrollToSection(aboutRef)}
            className="text-white hover:text-gold animate-bounce"
          >
            <ArrowDown className="h-8 w-8" />
          </Button>
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              About <span className="text-gold">Us</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              We are dedicated to showcasing the rich artistic heritage and contemporary creativity of Kenya. 
              Our platform connects art lovers with exceptional artists, providing a space to appreciate, 
              experience, and acquire distinctive Kenyan artworks.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-secondary p-6 rounded-lg text-center">
              <h3 className="font-serif text-2xl font-semibold mb-4">Our Mission</h3>
              <p className="text-gray-600">
                To promote and preserve Kenyan artistic expression by providing a platform that connects 
                artists with art enthusiasts locally and globally.
              </p>
            </div>
            
            <div className="bg-secondary p-6 rounded-lg text-center">
              <h3 className="font-serif text-2xl font-semibold mb-4">Our Vision</h3>
              <p className="text-gray-600">
                To be the premier destination for experiencing and collecting contemporary Kenyan art, 
                nurturing artistic talent and cultural appreciation.
              </p>
            </div>
            
            <div className="bg-secondary p-6 rounded-lg text-center">
              <h3 className="font-serif text-2xl font-semibold mb-4">Our Values</h3>
              <p className="text-gray-600">
                Authenticity, cultural integrity, artistic excellence, accessibility, 
                and sustainable support for the Kenyan art ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      <div ref={artworksRef}>
        <ArtworkRecommendations />
      </div>

      {/* Featured Exhibitions Section */}
      <section ref={exhibitionsRef} className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold">
              Upcoming <span className="text-gold">Exhibitions</span>
            </h2>
            <Link to="/exhibitions">
              <Button variant="ghost" className="text-gold hover:text-gold-dark flex items-center gap-2">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="exhibition-grid">
            {loading ? (
              <p className="text-center w-full">Loading exhibitions...</p>
            ) : featuredExhibitions.length > 0 ? (
              featuredExhibitions.map((exhibition) => (
                <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
              ))
            ) : (
              <p className="text-center w-full">No exhibitions found</p>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} className="py-20 bg-secondary">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                Get In <span className="text-gold">Touch</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Have questions about our artworks, exhibitions, or services? Send us a message and our team will get back to you as soon as possible.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 mt-1 text-gold" />
                  <div>
                    <h4 className="font-semibold">Location</h4>
                    <p className="text-gray-600">Kimathi Street, Nairobi, Kenya</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-3 mt-1 text-gold" />
                  <div>
                    <h4 className="font-semibold">Opening Hours</h4>
                    <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-gray-600">Weekends: 10:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>
              
              <Link to="/contact">
                <Button className="bg-gold hover:bg-gold-dark text-white">
                  Contact Us
                </Button>
              </Link>
            </div>
            
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=1000" 
                alt="Art Gallery" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatBot from '@/components/ChatBot';
import AdminLayout from '@/components/AdminLayout';
import ArtistLayout from '@/components/ArtistLayout';

// Pages
import Index from '@/pages/Index';
import Home from '@/pages/Home';
import CorporatePage from '@/pages/CorporatePage';
import ArtworksPage from '@/pages/ArtworksPage';
import ArtworkDetail from '@/pages/ArtworkDetail';
import ArtworkCheckout from '@/pages/ArtworkCheckout';
import ExhibitionsPage from '@/pages/ExhibitionsPage';
import ExhibitionDetail from '@/pages/ExhibitionDetail';
import ExhibitionCheckout from '@/pages/ExhibitionCheckout';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Profile from '@/pages/Profile';
import Payment from '@/pages/Payment';
import PaymentSuccess from '@/pages/PaymentSuccess';
import NotFound from '@/pages/NotFound';

// Admin Pages
import AdminLogin from '@/pages/AdminLogin';
import Admin from '@/pages/Admin';
import AdminArtworks from '@/pages/AdminArtworks';
import AdminExhibitions from '@/pages/AdminExhibitions';
import AdminMessages from '@/pages/AdminMessages';
import AdminTickets from '@/pages/AdminTickets';
import AdminOrders from '@/pages/AdminOrders';
import AdminArtists from '@/pages/AdminArtists';
import AdminReports from '@/pages/AdminReports';
import AdminCancellations from '@/pages/AdminCancellations';

// Artist Pages
import ArtistLogin from '@/pages/ArtistLogin';
import ArtistSignup from '@/pages/ArtistSignup';
import Artist from '@/pages/Artist';
import ArtistArtworks from '@/pages/ArtistArtworks';
import ArtistAddArtwork from '@/pages/ArtistAddArtwork';
import ArtistEditArtwork from '@/pages/ArtistEditArtwork';
import ArtistOrders from '@/pages/ArtistOrders';

import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              {/* Index route */}
              <Route path="/" element={<Index />} />
              
              {/* Home route with navbar */}
              <Route path="/home" element={
                <>
                  <Navbar />
                  <Home />
                  <Footer />
                  <ChatBot />
                </>
              } />
              
              {/* Corporate page route */}
              <Route path="/corporate" element={
                <>
                  <Navbar />
                  <CorporatePage />
                  <Footer />
                  <ChatBot />
                </>
              } />
              
              {/* Main routes with navbar */}
              <Route path="/artworks" element={
                <>
                  <Navbar />
                  <ArtworksPage />
                  <Footer />
                  <ChatBot />
                </>
              } />
              <Route path="/artworks/:id" element={
                <>
                  <Navbar />
                  <ArtworkDetail />
                  <Footer />
                  <ChatBot />
                </>
              } />
              <Route path="/artworks/:id/checkout" element={
                <>
                  <Navbar />
                  <ArtworkCheckout />
                  <Footer />
                </>
              } />
              <Route path="/exhibitions" element={
                <>
                  <Navbar />
                  <ExhibitionsPage />
                  <Footer />
                  <ChatBot />
                </>
              } />
              <Route path="/exhibitions/:id" element={
                <>
                  <Navbar />
                  <ExhibitionDetail />
                  <Footer />
                  <ChatBot />
                </>
              } />
              <Route path="/exhibitions/:id/checkout" element={
                <>
                  <Navbar />
                  <ExhibitionCheckout />
                  <Footer />
                </>
              } />
              <Route path="/contact" element={
                <>
                  <Navbar />
                  <Contact />
                  <Footer />
                  <ChatBot />
                </>
              } />
              <Route path="/login" element={
                <>
                  <Navbar />
                  <Login />
                  <Footer />
                </>
              } />
              <Route path="/signup" element={
                <>
                  <Navbar />
                  <Signup />
                  <Footer />
                </>
              } />
              <Route path="/profile" element={
                <>
                  <Navbar />
                  <Profile />
                  <Footer />
                </>
              } />
              <Route path="/payment" element={
                <>
                  <Navbar />
                  <Payment />
                  <Footer />
                </>
              } />
              <Route path="/payment-success" element={
                <>
                  <Navbar />
                  <PaymentSuccess />
                  <Footer />
                </>
              } />

              {/* Admin routes */}
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout><Admin /></AdminLayout>} />
              <Route path="/admin/artworks" element={<AdminLayout><AdminArtworks /></AdminLayout>} />
              <Route path="/admin/exhibitions" element={<AdminLayout><AdminExhibitions /></AdminLayout>} />
              <Route path="/admin/messages" element={<AdminLayout><AdminMessages /></AdminLayout>} />
              <Route path="/admin/tickets" element={<AdminLayout><AdminTickets /></AdminLayout>} />
              <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
              <Route path="/admin/artists" element={<AdminLayout><AdminArtists /></AdminLayout>} />
              <Route path="/admin/reports" element={<AdminLayout><AdminReports /></AdminLayout>} />
              <Route path="/admin/cancellations" element={<AdminLayout><AdminCancellations /></AdminLayout>} />

              {/* Artist routes */}
              <Route path="/artist-login" element={<ArtistLogin />} />
              <Route path="/artist-signup" element={<ArtistSignup />} />
              <Route path="/artist" element={<ArtistLayout><Artist /></ArtistLayout>} />
              <Route path="/artist/artworks" element={<ArtistLayout><ArtistArtworks /></ArtistLayout>} />
              <Route path="/artist/add-artwork" element={<ArtistLayout><ArtistAddArtwork /></ArtistLayout>} />
              <Route path="/artist/edit-artwork/:id" element={<ArtistLayout><ArtistEditArtwork /></ArtistLayout>} />
              <Route path="/artist/orders" element={<ArtistLayout><ArtistOrders /></ArtistLayout>} />

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

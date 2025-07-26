
import { Artwork, Exhibition, User } from "@/types";

// Admin user
export const adminUser: User = {
  id: "admin1",
  name: "Gallery Admin",
  email: "admin@artexhibit.co.ke",
  phone: "+254712345678",
  isAdmin: true
};

// Regular users
export const users: User[] = [
  {
    id: "user1",
    name: "John Kamau",
    email: "john@example.com",
    phone: "+254723456789",
    isAdmin: false
  },
  {
    id: "user2",
    name: "Sarah Wanjiku",
    email: "sarah@example.com",
    phone: "+254734567890",
    isAdmin: false
  }
];

// Artworks
export const artworks: Artwork[] = [
  {
    id: "art1",
    title: "Maasai Market Sunset",
    artist: "James Mwangi",
    description: "A vibrant depiction of the famous Maasai Market at sunset, showcasing the rich colors and bustling activity of Kenyan culture.",
    price: 45000,
    imageUrl: "https://images.unsplash.com/photo-1578926288207-32356a82da6f?q=80&w=1000",
    dimensions: "60cm x 80cm",
    medium: "Acrylic on Canvas",
    year: 2022,
    status: "available"
  },
  {
    id: "art2",
    title: "Mount Kenya Mist",
    artist: "Lucy Wambui",
    description: "A serene landscape showing Mount Kenya shrouded in morning mist, capturing the mystical beauty of Kenya's highest peak.",
    price: 67500,
    imageUrl: "https://images.unsplash.com/photo-1604537466158-719b1972feb8?q=80&w=1000",
    dimensions: "90cm x 120cm",
    medium: "Oil on Canvas",
    year: 2021,
    status: "available"
  },
  {
    id: "art3",
    title: "Nairobi Skyline",
    artist: "David Ochieng",
    description: "An urban landscape showcasing Nairobi's modern skyline at dusk, highlighting the contrast between traditional and contemporary architecture.",
    price: 52000,
    imageUrl: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?q=80&w=1000",
    dimensions: "70cm x 100cm",
    medium: "Mixed Media",
    year: 2023,
    status: "available"
  },
  {
    id: "art4",
    title: "Samburu Warriors",
    artist: "Elizabeth Njeri",
    description: "A powerful portrait of Samburu warriors in traditional attire, celebrating the proud heritage and resilience of this Kenyan tribe.",
    price: 38000,
    imageUrl: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1000",
    dimensions: "50cm x 70cm",
    medium: "Watercolor",
    year: 2022,
    status: "available"
  },
  {
    id: "art5",
    title: "Lake Turkana Dreams",
    artist: "Michael Kimani",
    description: "An atmospheric rendering of Lake Turkana at twilight, showcasing the unique jade-colored waters and stark landscapes of northern Kenya.",
    price: 62000,
    imageUrl: "https://images.unsplash.com/photo-1565118531796-763e5082d113?q=80&w=1000",
    dimensions: "80cm x 110cm",
    medium: "Oil on Canvas",
    year: 2023,
    status: "available"
  },
  {
    id: "art6",
    title: "Lamu Old Town",
    artist: "Fatima Hassan",
    description: "A detailed architectural study of the UNESCO World Heritage site of Lamu Old Town, capturing its Swahili architectural heritage and narrow streets.",
    price: 48000,
    imageUrl: "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?q=80&w=1000",
    dimensions: "60cm x 90cm",
    medium: "Pen and Ink with Watercolor",
    year: 2021,
    status: "available"
  }
];

// Exhibitions
export const exhibitions: Exhibition[] = [
  {
    id: "exh1",
    title: "Contemporary Kenyan Visions",
    description: "A showcase of emerging Kenyan artists exploring themes of identity, urbanization, and cultural heritage through various media.",
    location: "Nairobi National Museum, Nairobi",
    startDate: "2023-10-15",
    endDate: "2023-11-30",
    ticketPrice: 1500,
    imageUrl: "https://images.unsplash.com/photo-1594122230689-45899d9e6f69?q=80&w=1000",
    totalSlots: 100,
    availableSlots: 45,
    status: "upcoming"
  },
  {
    id: "exh2",
    title: "Maasai Modernism",
    description: "An exploration of how traditional Maasai art forms have influenced and been transformed by contemporary artistic practices in East Africa.",
    location: "Circle Art Gallery, Lavington, Nairobi",
    startDate: "2023-12-10",
    endDate: "2024-01-20",
    ticketPrice: 2000,
    imageUrl: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=1000",
    totalSlots: 80,
    availableSlots: 80,
    status: "upcoming"
  },
  {
    id: "exh3",
    title: "Coastal Textures: Art from the Kenyan Shore",
    description: "Featuring artists from Kenya's coastal regions, exploring themes of maritime heritage, environmental change, and cultural fusion.",
    location: "Fort Jesus Museum, Mombasa",
    startDate: "2023-11-05",
    endDate: "2023-12-15",
    ticketPrice: 1200,
    imageUrl: "https://images.unsplash.com/photo-1577720643272-265f09367cd7?q=80&w=1000",
    totalSlots: 150,
    availableSlots: 82,
    status: "upcoming"
  },
  {
    id: "exh4",
    title: "Digital Savannah: New Media Art from Kenya",
    description: "A cutting-edge exhibition showcasing how Kenyan artists are using digital technologies, VR, and interactive installations to reimagine traditional narratives.",
    location: "The GoDown Arts Centre, Nairobi",
    startDate: "2024-02-10",
    endDate: "2024-03-25",
    ticketPrice: 1800,
    imageUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1000",
    totalSlots: 120,
    availableSlots: 120,
    status: "upcoming"
  }
];

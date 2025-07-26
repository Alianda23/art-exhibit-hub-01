import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, X, ChevronDown, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { submitContactMessage } from '@/services/api';

type Message = {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

// FAQ database with all the questions
const faqs = [
  {
    question: "What are your opening hours?",
    keywords: ["open", "hour", "time", "when", "visit"],
    answer: "Our gallery is open Monday - Friday: 9:00 AM - 6:00 PM, Saturday: 10:00 AM - 5:00 PM, and Sunday: 11:00 AM - 4:00 PM."
  },
  {
    question: "How can I buy artwork?",
    keywords: ["buy", "purchase", "how", "artwork", "acquire"],
    answer: "You can purchase artwork directly from our website by viewing the artwork details and clicking the 'Buy Now' button. We accept various payment methods including M-Pesa."
  },
  {
    question: "Can I view artwork in person before buying?",
    keywords: ["view", "person", "before", "buying", "see", "physical", "gallery"],
    answer: "Some artworks may be available at local exhibitions. Keep an eye on our Events page for upcoming exhibitions."
  },
  {
    question: "How do I buy a piece of art?",
    keywords: ["buy", "how", "purchase", "piece", "art"],
    answer: "Simply click on the artwork you love and follow the checkout process."
  },
  {
    question: "What payment methods do you accept?",
    keywords: ["payment", "method", "pay", "accept", "mpesa", "m-pesa", "money", "cash"],
    answer: "We accept M-Pesa. All transactions are secure."
  },
  {
    question: "Is shipping included in the price?",
    keywords: ["ship", "include", "price", "cost", "delivery", "fee"],
    answer: "Shipping costs vary based on location and artwork size. They'll be calculated at checkout."
  },
  {
    question: "Can I return artwork?",
    keywords: ["return", "back", "refund", "exchange", "cancel"],
    answer: "Yes, returns are accepted within 7 days if the item is damaged or not as described."
  },
  {
    question: "How long does shipping take?",
    keywords: ["long", "shipping", "take", "time", "delivery", "when", "arrive"],
    answer: "Domestic deliveries take 3–7 business days. International orders can take 7–14 days depending on customs."
  },
  {
    question: "Do you ship internationally?",
    keywords: ["ship", "international", "worldwide", "abroad", "overseas", "foreign", "country"],
    answer: "Yes, we ship artwork internationally. Shipping costs depend on the destination and the size of the artwork. Please contact us for a shipping quote."
  },
  {
    question: "How is the artwork packaged?",
    keywords: ["package", "pack", "box", "wrap", "secure", "safe", "shipping"],
    answer: "Each piece is professionally packed to ensure safe delivery. Fragile pieces are double-boxed and cushioned."
  },
  {
    question: "How can I sell my artwork here?",
    keywords: ["sell", "artist", "my", "artwork", "submit", "portfolio"],
    answer: "Send us an email and submit your portfolio. Our team will review and get in touch."
  },
  {
    question: "How do I apply for an exhibition?",
    keywords: ["apply", "exhibition", "show", "display", "gallery", "event"],
    answer: "Send us an email and submit your portfolio. Our team will review and get in touch."
  },
  {
    question: "Do artists handle their own shipping?",
    keywords: ["artist", "handle", "shipping", "fulfillment", "delivery"],
    answer: "We offer fulfillment support for artists."
  },
  {
    question: "Can I visit your gallery in person?",
    keywords: ["visit", "gallery", "person", "physical", "location", "where"],
    answer: "Yes, our physical gallery is located at Kimathi Street, Nairobi, Kenya. We welcome visitors during our opening hours."
  },
  {
    question: "How do I book for an exhibition?",
    keywords: ["book", "exhibition", "ticket", "attend", "visit", "event"],
    answer: "You can book tickets for our exhibitions through our website by navigating to the Exhibitions page, selecting your preferred exhibition, and clicking 'Book Now'."
  }
];

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [needsContactInfo, setNeedsContactInfo] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          content: "Hello! Welcome to ArtExhibit. How can I help you today? You can ask me about our exhibitions, artwork, or anything else.",
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const findFAQAnswer = (question: string): string | null => {
    const normalizedInput = question.toLowerCase().trim();
    const words = normalizedInput.split(/\s+/); // Split input into words
    
    // Define a scoring system for FAQ matches
    const faqScores = faqs.map(faq => {
      let score = 0;
      
      // Check for keyword matches
      faq.keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        // Full keyword match
        if (normalizedInput.includes(keywordLower)) {
          score += 2; // Higher score for a full keyword match
        }
        
        // Check if any individual words match keywords
        words.forEach(word => {
          if (word.length > 2 && keywordLower.includes(word)) {
            score += 1; // Partial match
          }
          if (keywordLower === word) {
            score += 2; // Exact word match
          }
        });
      });
      
      // Exact phrase matching for the question itself
      if (normalizedInput.includes(faq.question.toLowerCase())) {
        score += 5; // Highest priority for matching the actual question
      }
      
      return { faq, score };
    });
    
    // Sort by score (highest first) and get the best match
    const bestMatches = faqScores
      .filter(item => item.score > 0) // Only consider items with some relevance
      .sort((a, b) => b.score - a.score);
    
    // Return the best match if score is above threshold, otherwise null
    return bestMatches.length > 0 ? bestMatches[0].faq.answer : null;
  };
  
  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    const userMessageId = Date.now();
    const userMessage: Message = {
      id: userMessageId,
      content: currentMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    
    const faqAnswer = findFAQAnswer(currentMessage);
    
    setTimeout(() => {
      if (faqAnswer) {
        const botMessage = {
          id: userMessageId + 1,
          content: faqAnswer,
          sender: 'bot' as const,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        setMessages(prev => [...prev, {
          id: userMessageId + 1,
          content: "I don't have an immediate answer to your question. Please provide your contact details so our team can get back to you promptly.",
          sender: 'bot',
          timestamp: new Date()
        }]);
        setNeedsContactInfo(true);
      }
    }, 1000);
  };
  
  const handleContactInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactInfo.name || !contactInfo.email || !contactInfo.phone || !contactInfo.message) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    const whatsappMessage = `
New customer inquiry:
Name: ${contactInfo.name}
Email: ${contactInfo.email}
Phone: ${contactInfo.phone}
Message: ${contactInfo.message}
    `;
    
    setIsSubmitting(true);
    
    try {
      console.log("Sending chat message to WhatsApp and admin panel:", contactInfo);
      
      // Send message to WhatsApp
      const whatsappResult = await sendWhatsAppMessage(whatsappMessage);
      console.log("WhatsApp message result:", whatsappResult);
      
      // Also send to the admin panel via contact endpoint
      const contactResult = await submitContactMessage({
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        message: contactInfo.message,
        source: 'chat_bot' // Add source to identify it came from chat
      });
      
      console.log("Contact submission result:", contactResult);
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: "Thank you! Your information has been sent to our team. We'll get back to you as soon as possible via WhatsApp (+254741080177) or email.",
        sender: 'bot',
        timestamp: new Date()
      }]);
      
      toast({
        title: "Message sent",
        description: "We've received your message and will get back to you soon!",
      });
      
      setContactInfo({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      
      setNeedsContactInfo(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <button 
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-gold text-white p-4 rounded-full shadow-lg hover:bg-gold-dark z-50"
        aria-label="Open Chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
      
      {isOpen && (
        <Card className={`fixed bottom-20 right-6 w-80 sm:w-96 shadow-xl z-50 flex flex-col transition-all duration-300 ease-in-out ${isExpanded ? 'h-[80vh]' : 'h-[60vh]'}`}>
          <div className="bg-gold text-white p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-medium">ArtExhibit Chat Support</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={toggleExpand} className="text-white hover:text-gray-200">
                <ChevronDown className={`h-5 w-5 transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`mb-4 max-w-[80%] ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}
              >
                <div 
                  className={`p-3 rounded-lg ${
                    message.sender === 'user' 
                      ? 'bg-gold text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {message.content}
                </div>
                <div 
                  className={`text-xs mt-1 text-gray-500 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            
            {needsContactInfo && (
              <form onSubmit={handleContactInfoSubmit} className="bg-gray-50 p-4 rounded-lg mt-4">
                <h4 className="font-medium text-gray-800 mb-3">Please provide your contact information:</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={contactInfo.name} 
                      onChange={(e) => setContactInfo({...contactInfo, name: e.target.value})}
                      placeholder="Your name" 
                      required 
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={contactInfo.email} 
                      onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                      placeholder="Your email" 
                      required 
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={contactInfo.phone} 
                      onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                      placeholder="+254..." 
                      required 
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Your Question/Message</Label>
                    <Textarea 
                      id="message" 
                      value={contactInfo.message} 
                      onChange={(e) => setContactInfo({...contactInfo, message: e.target.value})}
                      placeholder="Please provide more details about your inquiry" 
                      rows={3}
                      required 
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gold hover:bg-gold-dark"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Submit"}
                  </Button>
                </div>
              </form>
            )}
          </div>
          
          {!needsContactInfo && (
            <div className="p-3 border-t">
              <div className="flex items-center space-x-2">
                <Input 
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="icon"
                  className="bg-gold hover:bg-gold-dark"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default ChatBot;

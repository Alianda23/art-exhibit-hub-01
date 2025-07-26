
import { Artwork } from '@/types';
import { authFetch } from '@/services/api';

interface UserPreferences {
  favoriteArtists: { artist: string; count: number; weight: number }[];
  preferredMediums: { medium: string; count: number; weight: number }[];
  priceRanges: { min: number; max: number; weight: number }[];
  averagePrice: number;
  purchaseHistory: {
    artworkId: string;
    artist: string;
    medium: string;
    price: number;
  }[];
  exhibitionHistory: {
    exhibitionId: string;
    exhibitionTitle: string;
  }[];
}

export class RecommendationEngine {
  
  // Generate recommendations based on user's purchase and exhibition history
  static async generatePersonalizedRecommendations(
    userId: string, 
    allArtworks: Artwork[], 
    maxRecommendations: number = 6
  ): Promise<Artwork[]> {
    try {
      console.log('Generating personalized recommendations for user:', userId);
      
      // Fetch user's order and booking history
      const userHistory = await authFetch(`/user/${userId}/orders`);
      
      if (!userHistory || userHistory.error) {
        console.log('No user history found, user needs to make first purchase');
        return []; // Return empty array for users with no history
      }
      
      // Check if user has any actual purchases
      const hasPurchases = userHistory.orders && userHistory.orders.length > 0;
      
      if (!hasPurchases) {
        console.log('User has no purchase history, returning empty recommendations');
        return []; // Return empty array if no purchases
      }
      
      const preferences = this.analyzeUserPreferences(userHistory);
      console.log('User preferences analyzed:', {
        topArtists: preferences.favoriteArtists.slice(0, 3),
        topMediums: preferences.preferredMediums.slice(0, 2),
        priceRanges: preferences.priceRanges,
        averagePrice: preferences.averagePrice
      });
      
      // Get list of artwork IDs the user has already purchased
      const purchasedArtworkIds = preferences.purchaseHistory.map(p => p.artworkId);
      console.log('User has purchased these artworks:', purchasedArtworkIds);
      
      // Filter out artworks the user has already purchased
      const availableArtworks = allArtworks.filter(artwork => 
        artwork.status === 'available' && 
        !purchasedArtworkIds.includes(artwork.id.toString()) &&
        !purchasedArtworkIds.includes(artwork.id)
      );
      
      console.log(`Filtered artworks: ${availableArtworks.length} available (excluding ${purchasedArtworkIds.length} already purchased)`);
      
      if (availableArtworks.length === 0) {
        console.log('No available artworks left after filtering purchased items');
        return [];
      }
      
      // Score all available artworks based on user preferences
      const scoredArtworks = availableArtworks
        .map(artwork => ({
          artwork,
          score: this.calculateRecommendationScore(artwork, preferences),
          reasons: this.getRecommendationReasons(artwork, preferences)
        }))
        .filter(item => item.score > 0) // Only include artworks with positive scores
        .sort((a, b) => b.score - a.score);
      
      console.log('Top scored artworks:', scoredArtworks.slice(0, 5).map(s => ({ 
        title: s.artwork.title, 
        artist: s.artwork.artist,
        price: s.artwork.price,
        score: s.score.toFixed(1),
        reasons: s.reasons
      })));
      
      return scoredArtworks
        .slice(0, maxRecommendations)
        .map(item => item.artwork);
        
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      return []; // Return empty array on error for personalized recommendations
    }
  }
  
  // Analyze user's past behavior to understand preferences with more sophisticated weighting
  private static analyzeUserPreferences(userHistory: any): UserPreferences {
    const preferences: UserPreferences = {
      favoriteArtists: [],
      preferredMediums: [],
      priceRanges: [],
      averagePrice: 0,
      purchaseHistory: [],
      exhibitionHistory: []
    };
    
    // Analyze artwork orders
    if (userHistory.orders && userHistory.orders.length > 0) {
      const artistCount: { [key: string]: number } = {};
      const mediumCount: { [key: string]: number } = {};
      const prices: number[] = [];
      
      userHistory.orders.forEach((order: any) => {
        // Count artist preferences
        artistCount[order.artist] = (artistCount[order.artist] || 0) + 1;
        
        // Count medium preferences (if available)
        if (order.medium) {
          mediumCount[order.medium] = (mediumCount[order.medium] || 0) + 1;
        }
        
        // Collect price data
        const price = order.price || order.totalAmount;
        prices.push(price);
        
        // Store purchase history with proper artwork ID handling
        preferences.purchaseHistory.push({
          artworkId: order.artworkId || order.artwork_id,
          artist: order.artist,
          medium: order.medium || 'Unknown',
          price: price
        });
      });
      
      // Calculate average price
      preferences.averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      // Create weighted favorite artists (higher weight for more purchases)
      preferences.favoriteArtists = Object.entries(artistCount)
        .map(([artist, count]) => ({
          artist,
          count,
          weight: count * 2 // Artists with multiple purchases get higher weight
        }))
        .sort((a, b) => b.weight - a.weight);
      
      // Create weighted preferred mediums
      preferences.preferredMediums = Object.entries(mediumCount)
        .map(([medium, count]) => ({
          medium,
          count,
          weight: count * 1.5
        }))
        .sort((a, b) => b.weight - a.weight);
      
      // Create more focused price ranges based on actual purchase patterns
      if (prices.length > 0) {
        const sortedPrices = prices.sort((a, b) => a - b);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = preferences.averagePrice;
        
        // Primary price range: tight around average (±25%)
        preferences.priceRanges.push({
          min: avgPrice * 0.75,
          max: avgPrice * 1.25,
          weight: 3.0 // Highest weight for similar price range
        });
        
        // Secondary price range: moderate expansion (±50%)
        preferences.priceRanges.push({
          min: avgPrice * 0.5,
          max: avgPrice * 1.5,
          weight: 2.0
        });
        
        // Tertiary price range: actual purchase range with some buffer
        preferences.priceRanges.push({
          min: minPrice * 0.8,
          max: maxPrice * 1.2,
          weight: 1.0
        });
      }
    }
    
    // Analyze exhibition bookings for additional insights
    if (userHistory.bookings && userHistory.bookings.length > 0) {
      userHistory.bookings.forEach((booking: any) => {
        preferences.exhibitionHistory.push({
          exhibitionId: booking.exhibitionId,
          exhibitionTitle: booking.exhibitionTitle
        });
      });
    }
    
    return preferences;
  }
  
  // Enhanced scoring system with proper weighting
  private static calculateRecommendationScore(artwork: Artwork, preferences: UserPreferences): number {
    let score = 0;
    let maxPossibleScore = 0;
    
    // Artist preference scoring (HIGHEST PRIORITY - 40% of total score)
    const artistWeight = 100;
    maxPossibleScore += artistWeight;
    
    const favoriteArtist = preferences.favoriteArtists.find(fa => fa.artist === artwork.artist);
    if (favoriteArtist) {
      // Give full score for exact artist match, scaled by purchase frequency
      const artistScore = artistWeight * Math.min(favoriteArtist.weight / 3, 1); // Cap at full score
      score += artistScore;
      console.log(`Artist match for ${artwork.artist}: +${artistScore.toFixed(1)} points`);
    }
    
    // Price range scoring (HIGH PRIORITY - 30% of total score)
    const priceWeight = 75;
    maxPossibleScore += priceWeight;
    
    const artworkPrice = artwork.price;
    let bestPriceScore = 0;
    
    preferences.priceRanges.forEach(range => {
      if (artworkPrice >= range.min && artworkPrice <= range.max) {
        const priceScore = (priceWeight * range.weight) / 3; // Normalize by max weight
        if (priceScore > bestPriceScore) {
          bestPriceScore = priceScore;
        }
      }
    });
    
    score += bestPriceScore;
    if (bestPriceScore > 0) {
      console.log(`Price match for ${artwork.title} (${artworkPrice}): +${bestPriceScore.toFixed(1)} points`);
    }
    
    // Medium preference scoring (MEDIUM PRIORITY - 20% of total score)
    const mediumWeight = 50;
    maxPossibleScore += mediumWeight;
    
    const preferredMedium = preferences.preferredMediums.find(pm => pm.medium === artwork.medium);
    if (preferredMedium) {
      const mediumScore = (mediumWeight * preferredMedium.weight) / 3; // Normalize
      score += mediumScore;
      console.log(`Medium match for ${artwork.medium}: +${mediumScore.toFixed(1)} points`);
    }
    
    // Similar artist bonus (LOW PRIORITY - 10% of total score)
    const similarArtistWeight = 25;
    maxPossibleScore += similarArtistWeight;
    
    const hasSimilarArtist = preferences.favoriteArtists.some(favoriteArtist => {
      const artistWords = favoriteArtist.artist.toLowerCase().split(' ');
      const artworkArtistWords = artwork.artist.toLowerCase().split(' ');
      
      // Check for shared last names or similar naming patterns
      return artistWords.some(word => 
        word.length > 3 && artworkArtistWords.some(artworkWord => 
          artworkWord.includes(word) || word.includes(artworkWord)
        )
      );
    });
    
    if (hasSimilarArtist && !preferences.favoriteArtists.find(fa => fa.artist === artwork.artist)) {
      score += similarArtistWeight * 0.5; // Half points for similar artists
      console.log(`Similar artist bonus for ${artwork.artist}: +${(similarArtistWeight * 0.5).toFixed(1)} points`);
    }
    
    // Normalize score to 0-100 range
    const normalizedScore = (score / maxPossibleScore) * 100;
    
    // Only return artworks that have at least some relevance (score > 20)
    return normalizedScore > 20 ? normalizedScore : 0;
  }
  
  // Get reasons for recommendation (for debugging)
  private static getRecommendationReasons(artwork: Artwork, preferences: UserPreferences): string[] {
    const reasons: string[] = [];
    
    if (preferences.favoriteArtists.find(fa => fa.artist === artwork.artist)) {
      reasons.push(`Same artist: ${artwork.artist}`);
    }
    
    if (preferences.preferredMediums.find(pm => pm.medium === artwork.medium)) {
      reasons.push(`Preferred medium: ${artwork.medium}`);
    }
    
    const inPriceRange = preferences.priceRanges.some(range => 
      artwork.price >= range.min && artwork.price <= range.max
    );
    if (inPriceRange) {
      reasons.push(`Within price range: ${artwork.price}`);
    }
    
    return reasons;
  }
  
  // Get recommendations for similar artworks (for artwork detail pages)
  static generateSimilarArtworkRecommendations(
    currentArtwork: Artwork, 
    allArtworks: Artwork[], 
    maxRecommendations: number = 4
  ): Artwork[] {
    const similarArtworks = allArtworks
      .filter(artwork => 
        artwork.id !== currentArtwork.id && 
        artwork.status === 'available'
      )
      .map(artwork => ({
        artwork,
        similarity: this.calculateSimilarityScore(currentArtwork, artwork)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxRecommendations)
      .map(item => item.artwork);
    
    return similarArtworks;
  }
  
  // Calculate similarity between two artworks
  private static calculateSimilarityScore(artwork1: Artwork, artwork2: Artwork): number {
    let score = 0;
    
    // Same artist gets highest score
    if (artwork1.artist === artwork2.artist) {
      score += 50;
    }
    
    // Same medium gets medium score
    if (artwork1.medium === artwork2.medium) {
      score += 30;
    }
    
    // Similar price range gets lower score
    const priceDifference = Math.abs(artwork1.price - artwork2.price);
    const averagePrice = (artwork1.price + artwork2.price) / 2;
    const priceRatio = priceDifference / averagePrice;
    
    if (priceRatio < 0.3) { // Within 30% price difference
      score += 20;
    } else if (priceRatio < 0.5) { // Within 50% price difference
      score += 10;
    }
    
    return score;
  }
}

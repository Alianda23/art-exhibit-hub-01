
from database import get_db_connection
from decimal import Decimal
import random
import string

def generate_ticket_code():
    """Generate a unique ticket code"""
    prefix = 'TKT'
    random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"{prefix}-{random_chars}"

def create_order(user_id, order_type, reference_id, amount):
    """Create a new order in the database"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        if order_type == 'artwork':
            # ... keep existing code (artwork order logic)
            # First check if artwork is still available
            check_artwork_query = "SELECT status FROM artworks WHERE id = %s"
            cursor.execute(check_artwork_query, (reference_id,))
            artwork_result = cursor.fetchone()
            
            if not artwork_result:
                return {"error": "Artwork not found"}
            
            if artwork_result[0] == 'sold':
                return {"error": "Artwork is already sold"}
            
            # Store artwork orders in artwork_orders table
            query = """
            INSERT INTO artwork_orders (user_id, artwork_id, total_amount, payment_status)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (user_id, reference_id, amount, 'pending'))
            
            # Mark artwork as sold immediately when order is created
            update_artwork_query = "UPDATE artworks SET status = 'sold' WHERE id = %s"
            cursor.execute(update_artwork_query, (reference_id,))
            
            connection.commit()
            
            order_id = cursor.lastrowid
            return {"success": True, "order_id": order_id}
        
        elif order_type == 'exhibition':
            # First check if exhibition has available slots
            check_exhibition_query = "SELECT available_slots FROM exhibitions WHERE id = %s"
            cursor.execute(check_exhibition_query, (reference_id,))
            exhibition_result = cursor.fetchone()
            
            if not exhibition_result:
                return {"error": "Exhibition not found"}
            
            available_slots = exhibition_result[0]
            
            # Check if enough slots are available (assuming 1 slot per booking for now)
            slots_needed = 1  # This could be passed as a parameter if needed
            if available_slots < slots_needed:
                return {"error": "Not enough slots available"}
            
            # Generate a ticket code for the exhibition booking
            ticket_code = generate_ticket_code()
            
            # Store exhibition orders in exhibition_bookings table
            query = """
            INSERT INTO exhibition_bookings (user_id, exhibition_id, total_amount, payment_status, ticket_code, slots, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (user_id, reference_id, amount, 'pending', ticket_code, slots_needed, 'active'))
            
            # Reduce available slots for the exhibition
            update_exhibition_query = "UPDATE exhibitions SET available_slots = available_slots - %s WHERE id = %s"
            cursor.execute(update_exhibition_query, (slots_needed, reference_id))
            
            connection.commit()
            
            order_id = cursor.lastrowid
            return {"success": True, "order_id": order_id, "ticket_code": ticket_code}
        
        else:
            return {"error": "Invalid order type"}
    except Exception as e:
        print(f"Error creating order: {e}")
        connection.rollback()
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# ... keep existing code (create_ticket, get_all_orders, get_all_tickets, get_user_orders, get_artist_artworks, get_artist_orders, get_all_artists functions) the same

def create_ticket(user_id, exhibition_id, slots):
    """Create a new ticket in the database"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # First check if exhibition has available slots
        check_exhibition_query = "SELECT available_slots FROM exhibitions WHERE id = %s"
        cursor.execute(check_exhibition_query, (exhibition_id,))
        exhibition_result = cursor.fetchone()
        
        if not exhibition_result:
            return {"error": "Exhibition not found"}
        
        available_slots = exhibition_result[0]
        
        if available_slots < slots:
            return {"error": f"Only {available_slots} slots available"}
        
        # Generate ticket code
        ticket_code = generate_ticket_code()
        
        # Store tickets in exhibition_bookings table with the ticket_code field
        query = """
        INSERT INTO exhibition_bookings (user_id, exhibition_id, ticket_code, slots, status)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (user_id, exhibition_id, ticket_code, slots, 'active'))
        
        # Reduce available slots for the exhibition
        update_exhibition_query = "UPDATE exhibitions SET available_slots = available_slots - %s WHERE id = %s"
        cursor.execute(update_exhibition_query, (slots, exhibition_id))
        
        connection.commit()
        
        ticket_id = cursor.lastrowid
        return {"success": True, "ticket_id": ticket_id, "ticket_code": ticket_code}
    except Exception as e:
        print(f"Error creating ticket: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_all_orders():
    """Get all orders from database"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Get artwork orders
        query = """
        SELECT ao.*, u.name as user_name, a.title as item_title
        FROM artwork_orders ao
        JOIN users u ON ao.user_id = u.id
        JOIN artworks a ON ao.artwork_id = a.id
        ORDER BY ao.order_date DESC
        """
        cursor.execute(query)
        artwork_orders = [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
        
        for order in artwork_orders:
            order['type'] = 'artwork'
            order['reference_id'] = order['artwork_id']
            
        return {"orders": artwork_orders}
    except Exception as e:
        print(f"Error getting orders: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_all_tickets():
    """Get all tickets from database"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Get exhibition bookings
        query = """
        SELECT eb.id, eb.user_id, u.name as user_name, eb.exhibition_id, 
               e.title as exhibition_title, e.image_url as exhibition_image_url,
               eb.booking_date, eb.ticket_code, eb.slots, eb.status,
               eb.total_amount, eb.payment_status
        FROM exhibition_bookings eb
        JOIN users u ON eb.user_id = u.id
        JOIN exhibitions e ON eb.exhibition_id = e.id
        ORDER BY eb.booking_date DESC
        """
        cursor.execute(query)
        
        tickets = []
        for row in cursor.fetchall():
            ticket = dict(zip([col[0] for col in cursor.description], row))
            tickets.append(ticket)
            
        return {"tickets": tickets}
    except Exception as e:
        print(f"Error getting tickets: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_user_orders(user_id):
    """Get all orders and bookings for a specific user"""
    connection = get_db_connection()
    if connection is None:
        print(f"Database connection failed for user {user_id}")
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Convert user_id to integer to ensure proper type matching
        user_id = int(user_id)
        print(f"Getting orders for user_id: {user_id} (type: {type(user_id)})")
        
        # Get user's artwork orders
        artwork_query = """
        SELECT ao.id, ao.artwork_id, a.title as artworkTitle, a.artist, a.image_url,
               ao.order_date as date, a.price, 0 as deliveryFee, 
               ao.total_amount as totalAmount, 
               ao.payment_status as status, ao.delivery_address as deliveryAddress
        FROM artwork_orders ao
        JOIN artworks a ON ao.artwork_id = a.id
        WHERE ao.user_id = %s
        ORDER BY ao.order_date DESC
        """
        print(f"Executing artwork query with user_id: {user_id}")
        cursor.execute(artwork_query, (user_id,))
        orders = [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
        print(f"Found {len(orders)} artwork orders for user {user_id}")
        
        # Get user's exhibition bookings
        booking_query = """
        SELECT eb.id, eb.exhibition_id as exhibitionId, e.title as exhibitionTitle,
               eb.booking_date as date, e.location, eb.slots, eb.ticket_code,
               eb.total_amount as totalAmount, eb.status, e.image_url
        FROM exhibition_bookings eb
        JOIN exhibitions e ON eb.exhibition_id = e.id
        WHERE eb.user_id = %s
        ORDER BY eb.booking_date DESC
        """
        print(f"Executing booking query with user_id: {user_id}")
        cursor.execute(booking_query, (user_id,))
        bookings = [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
        print(f"Found {len(bookings)} exhibition bookings for user {user_id}")
        
        result = {"orders": orders, "bookings": bookings}
        print(f"Final result for user {user_id}: {result}")
        return result
        
    except Exception as e:
        print(f"Error getting user orders for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_artist_artworks(artist_id):
    """Get all artworks for a specific artist"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Debug to check the artist_id being used
        print(f"Finding artworks for artist_id: {artist_id}")
        
        # Get all artworks where the artist_id matches or where the artist name matches
        # the name associated with the artist_id
        query = """
        SELECT a.*, 
               COALESCE((SELECT COUNT(*) FROM artwork_orders ao WHERE ao.artwork_id = a.id), 0) as order_count
        FROM artworks a
        JOIN artists art ON art.id = %s
        WHERE a.artist_id = %s OR a.artist = art.name
        ORDER BY a.created_at DESC
        """
        cursor.execute(query, (artist_id, artist_id))
        artworks = [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
        
        print(f"Artist {artist_id} artworks query result: {artworks}")
        
        # If no results found, try an alternative query to find by artist name only
        if not artworks:
            print(f"No artworks found with artist_id={artist_id}, trying to find by artist name")
            name_query = """
            SELECT name FROM artists WHERE id = %s
            """
            cursor.execute(name_query, (artist_id,))
            artist_name_row = cursor.fetchone()
            
            if artist_name_row:
                artist_name = artist_name_row[0]
                print(f"Found artist name: {artist_name}, searching artworks by this name")
                
                backup_query = """
                SELECT a.*, 
                       COALESCE((SELECT COUNT(*) FROM artwork_orders ao WHERE ao.artwork_id = a.id), 0) as order_count
                FROM artworks a
                WHERE a.artist = %s
                ORDER BY a.created_at DESC
                """
                cursor.execute(backup_query, (artist_name,))
                artworks = [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
                print(f"Backup query results: {artworks}")
        
        return {"artworks": artworks}
    except Exception as e:
        print(f"Error getting artist artworks: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_artist_orders(artist_id):
    """Get all orders for artworks by a specific artist"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Get orders for both artist_id and artist name matches
        query = """
        SELECT ao.*, a.title as artwork_title, u.name as buyer_name, u.email as buyer_email
        FROM artwork_orders ao
        JOIN artworks a ON ao.artwork_id = a.id
        JOIN users u ON ao.user_id = u.id
        WHERE a.artist_id = %s OR a.artist = (SELECT name FROM artists WHERE id = %s)
        ORDER BY ao.order_date DESC
        """
        cursor.execute(query, (artist_id, artist_id))
        orders = [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
        
        print(f"Artist {artist_id} orders query result: {orders}")
        
        return {"orders": orders}
    except Exception as e:
        print(f"Error getting artist orders: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_all_artists():
    """Get all artists from database"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        query = """
        SELECT a.id, a.name, a.email, a.bio, a.profile_image_url, a.phone, a.created_at,
               (SELECT COUNT(*) FROM artworks WHERE artist_id = a.id) as artwork_count
        FROM artists a
        ORDER BY a.created_at DESC
        """
        cursor.execute(query)
        artists = [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
        
        return {"artists": artists}
    except Exception as e:
        print(f"Error getting artists: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

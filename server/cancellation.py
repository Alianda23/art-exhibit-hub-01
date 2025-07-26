
from database import get_db_connection
from decimal import Decimal
import json
from datetime import datetime

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(DecimalEncoder, self).default(obj)

def create_cancellation_request(user_id, booking_id, reason):
    """Create a new ticket cancellation request"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # First get the booking details
        booking_query = """
        SELECT eb.id, eb.ticket_code, eb.total_amount, eb.status, e.title as exhibition_title
        FROM exhibition_bookings eb
        JOIN exhibitions e ON eb.exhibition_id = e.id
        WHERE eb.id = %s AND eb.user_id = %s
        """
        cursor.execute(booking_query, (booking_id, user_id))
        booking_result = cursor.fetchone()
        
        if not booking_result:
            return {"error": "Booking not found or you don't have permission to cancel it"}
        
        booking_id, ticket_code, total_amount, status, exhibition_title = booking_result
        
        if status == 'cancelled':
            return {"error": "This ticket is already cancelled"}
        
        # Check if there's already a pending cancellation request
        check_existing_query = """
        SELECT id FROM ticket_cancellation_requests 
        WHERE booking_id = %s AND status IN ('pending', 'approved')
        """
        cursor.execute(check_existing_query, (booking_id,))
        if cursor.fetchone():
            return {"error": "A cancellation request for this ticket is already pending"}
        
        # Create the cancellation request
        insert_query = """
        INSERT INTO ticket_cancellation_requests 
        (user_id, booking_id, ticket_code, exhibition_title, reason, refund_amount)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (user_id, booking_id, ticket_code, exhibition_title, reason, total_amount))
        
        # Update booking status to cancelled
        update_booking_query = "UPDATE exhibition_bookings SET status = 'cancelled' WHERE id = %s"
        cursor.execute(update_booking_query, (booking_id,))
        
        # Return slots to exhibition
        return_slots_query = """
        UPDATE exhibitions SET available_slots = available_slots + (
            SELECT slots FROM exhibition_bookings WHERE id = %s
        ) WHERE id = (
            SELECT exhibition_id FROM exhibition_bookings WHERE id = %s
        )
        """
        cursor.execute(return_slots_query, (booking_id, booking_id))
        
        connection.commit()
        
        cancellation_id = cursor.lastrowid
        return {
            "success": True, 
            "cancellation_id": cancellation_id,
            "message": "Cancellation request submitted successfully. Refund will be processed within 3 working days."
        }
        
    except Exception as e:
        print(f"Error creating cancellation request: {e}")
        connection.rollback()
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_all_cancellation_requests():
    """Get all cancellation requests for admin view"""
    print("=== get_all_cancellation_requests called ===")
    connection = get_db_connection()
    if connection is None:
        print("Database connection failed")
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # First check if the table exists
        cursor.execute("SHOW TABLES LIKE 'ticket_cancellation_requests'")
        table_exists = cursor.fetchone()
        print(f"Table exists: {bool(table_exists)}")
        
        if not table_exists:
            print("Cancellation table doesn't exist, returning empty list")
            return {"cancellations": []}
        
        query = """
        SELECT tcr.*, u.name as user_name, u.email as user_email,
               eb.booking_date, eb.slots, e.location, e.start_date, e.end_date
        FROM ticket_cancellation_requests tcr
        JOIN users u ON tcr.user_id = u.id
        JOIN exhibition_bookings eb ON tcr.booking_id = eb.id
        JOIN exhibitions e ON eb.exhibition_id = e.id
        ORDER BY tcr.created_at DESC
        """
        print(f"Executing query: {query}")
        cursor.execute(query)
        
        cancellations = []
        for row in cursor.fetchall():
            cancellation = dict(zip([col[0] for col in cursor.description], row))
            print(f"Raw cancellation data: {cancellation}")  # Debug log
            cancellations.append(cancellation)
            
        print(f"Total cancellations found: {len(cancellations)}")  # Debug log
        return {"cancellations": cancellations}
        
    except Exception as e:
        print(f"Error getting cancellation requests: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def update_cancellation_status(cancellation_id, status, admin_id=None, admin_notes=None):
    """Update the status of a cancellation request"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # If admin_id is not provided, try to get it from session or use a default
        if admin_id is None:
            admin_id = 1  # Default admin ID, you might want to get this from the JWT token
            
        update_query = """
        UPDATE ticket_cancellation_requests 
        SET status = %s, processed_by = %s, processed_at = NOW(), admin_notes = %s
        WHERE id = %s
        """
        cursor.execute(update_query, (status, admin_id, admin_notes, cancellation_id))
        
        if cursor.rowcount == 0:
            return {"error": "Cancellation request not found"}
        
        connection.commit()
        print(f"Updated cancellation {cancellation_id} to status {status}")  # Debug log
        return {"success": True, "message": f"Cancellation request {status} successfully"}
        
    except Exception as e:
        print(f"Error updating cancellation status: {e}")
        connection.rollback()
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_user_cancellation_requests(user_id):
    """Get cancellation requests for a specific user"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        query = """
        SELECT tcr.*, eb.booking_date, eb.slots
        FROM ticket_cancellation_requests tcr
        JOIN exhibition_bookings eb ON tcr.booking_id = eb.id
        WHERE tcr.user_id = %s
        ORDER BY tcr.created_at DESC
        """
        cursor.execute(query, (user_id,))
        
        cancellations = []
        for row in cursor.fetchall():
            cancellation = dict(zip([col[0] for col in cursor.description], row))
            cancellations.append(cancellation)
            
        return {"cancellations": cancellations}
        
    except Exception as e:
        print(f"Error getting user cancellation requests: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

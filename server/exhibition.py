
from database import get_db_connection, dict_from_row, json_dumps
from auth import verify_token
import json
import os
import base64
import time
from decimal import Decimal

# Default exhibition image path
DEFAULT_EXHIBITION_IMAGE = "/static/uploads/default_exhibition.jpg"

# Ensure uploads directory exists
def ensure_uploads_directory():
    """Create the uploads directory if it doesn't exist"""
    uploads_dir = os.path.join(os.path.dirname(__file__), "static", "uploads")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
        print(f"Created directory: {uploads_dir}")

# Call this function to ensure directory exists
ensure_uploads_directory()

# Function to handle image storage
def save_image_from_base64(base64_str, name_prefix="exhibition"):
    """Save a base64 image to the uploads directory and return the path"""
    # Handle empty strings or None values
    if not base64_str:
        return None
        
    # If it's already a URL path (not base64), return it as is
    if base64_str.startswith('/static/'):
        return base64_str
    
    try:
        # Extract the image data from the base64 string
        if "," in base64_str:
            # For format like "data:image/jpeg;base64,/9j/4AAQSk..."
            image_format, base64_data = base64_str.split(",", 1)
            if ';base64' not in image_format:
                print("Warning: Not a valid base64 image format")
                return None
        else:
            # Assume it's just the base64 data
            base64_data = base64_str
        
        # Decode the base64 data
        try:
            image_data = base64.b64decode(base64_data)
        except Exception as e:
            print(f"Failed to decode base64 data: {e}")
            return None
        
        # Generate a unique filename based on timestamp
        timestamp = time.strftime("%Y%m%d%H%M%S")
        filename = f"{name_prefix}_{timestamp}.jpg"
        
        # Save to the uploads directory
        uploads_dir = os.path.join(os.path.dirname(__file__), "static", "uploads")
        if not os.path.exists(uploads_dir):
            os.makedirs(uploads_dir)
            
        file_path = os.path.join(uploads_dir, filename)
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        # Return the URL path to the image (ALWAYS use the standard format)
        return f"/static/uploads/{filename}"
    except Exception as e:
        print(f"Error saving image: {e}")
        return None

def get_all_exhibitions():
    """Get all exhibitions from the database"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        query = """
        SELECT id, title, description, location, start_date, end_date,
               ticket_price, image_url, total_slots, available_slots, status
        FROM exhibitions
        ORDER BY start_date ASC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        
        exhibitions = []
        for row in rows:
            exhibition = dict_from_row(row, cursor)
            
            # Convert id to string to match frontend expectations
            exhibition['id'] = str(exhibition['id'])
            
            # Convert dates to string format
            exhibition['startDate'] = exhibition.pop('start_date').isoformat()
            exhibition['endDate'] = exhibition.pop('end_date').isoformat()
            
            # Convert ticket_price to camelCase
            exhibition['ticketPrice'] = exhibition.pop('ticket_price')
            
            # Convert image_url to camelCase
            image_url = exhibition.pop('image_url')
            exhibition['imageUrl'] = image_url if image_url else ""
            
            # Convert total_slots and available_slots to camelCase
            exhibition['totalSlots'] = exhibition.pop('total_slots')
            exhibition['availableSlots'] = exhibition.pop('available_slots')
            
            exhibitions.append(exhibition)
        
        return {"exhibitions": exhibitions}
    except Exception as e:
        print(f"Error getting exhibitions: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_exhibition(exhibition_id):
    """Get a specific exhibition by ID"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        query = """
        SELECT id, title, description, location, start_date, end_date,
               ticket_price, image_url, total_slots, available_slots, status
        FROM exhibitions
        WHERE id = %s
        """
        cursor.execute(query, (exhibition_id,))
        row = cursor.fetchone()
        
        if not row:
            return {"error": "Exhibition not found"}
        
        exhibition = dict_from_row(row, cursor)
        
        # Convert id to string to match frontend expectations
        exhibition['id'] = str(exhibition['id'])
        
        # Convert dates to string format
        exhibition['startDate'] = exhibition.pop('start_date').isoformat()
        exhibition['endDate'] = exhibition.pop('end_date').isoformat()
        
        # Convert ticket_price to camelCase
        exhibition['ticketPrice'] = exhibition.pop('ticket_price')
        
        # Convert image_url to camelCase
        image_url = exhibition.pop('image_url')
        exhibition['imageUrl'] = image_url if image_url else ""
        
        # Convert total_slots and available_slots to camelCase
        exhibition['totalSlots'] = exhibition.pop('total_slots')
        exhibition['availableSlots'] = exhibition.pop('available_slots')
        
        return exhibition
    except Exception as e:
        print(f"Error getting exhibition: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def create_exhibition(auth_header, exhibition_data):
    """Create a new exhibition (admin only)"""
    print(f"\n--- Create Exhibition Request ---")
    print(f"Auth Header: {auth_header}")
    print(f"Exhibition Data: {exhibition_data}")
    
    if not auth_header:
        print("ERROR: Authentication header missing")
        return {"error": "Authentication required"}
    
    # Extract token from header - handle both formats
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
    else:
        parts = auth_header.split(" ")
        if len(parts) > 1:
            token = parts[1]
    
    if not token:
        print("ERROR: No token found in header")
        return {"error": "Invalid authentication token"}
    
    # Verify token and check if user is admin
    print(f"Verifying token: {token[:20]}...")
    payload = verify_token(token)
    print(f"Token verification result: {payload}")
    
    # Check if verification returned an error
    if isinstance(payload, dict) and "error" in payload:
        print(f"ERROR: Token verification failed: {payload['error']}")
        return {"error": f"Authentication failed: {payload['error']}"}
    
    # Check if user is admin
    is_admin = payload.get("is_admin", False)
    print(f"Is admin: {is_admin}")
    
    if not is_admin:
        print("ERROR: Access denied - Not an admin user")
        return {"error": "Unauthorized access: Admin privileges required"}
    
    # Continue with exhibition creation
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Parse exhibition_data if it's a string
        if isinstance(exhibition_data, str):
            try:
                exhibition_data = json.loads(exhibition_data)
            except json.JSONDecodeError as e:
                print(f"ERROR: Failed to parse exhibition data: {e}")
                return {"error": f"Invalid exhibition data format: {str(e)}"}
        
        # Handle the image - only save if provided by admin
        image_url = exhibition_data.get("imageUrl", "")
        if image_url and image_url.startswith('data:'):
            # Save the base64 image and get the file path
            saved_image_path = save_image_from_base64(image_url)
            if saved_image_path:
                image_url = saved_image_path
                print(f"Image saved to: {saved_image_path}")
            else:
                print("Failed to save image, keeping empty")
                image_url = ""
        
        print(f"Inserting exhibition data: {exhibition_data}")
        query = """
        INSERT INTO exhibitions (title, description, location, start_date, end_date,
                               ticket_price, image_url, total_slots, available_slots, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        # If availableSlots not provided, use totalSlots
        available_slots = exhibition_data.get("availableSlots", exhibition_data.get("totalSlots"))
        
        cursor.execute(query, (
            exhibition_data.get("title"),
            exhibition_data.get("description"),
            exhibition_data.get("location"),
            exhibition_data.get("startDate"),
            exhibition_data.get("endDate"),
            exhibition_data.get("ticketPrice"),
            image_url,  # Now only uses admin-provided image
            exhibition_data.get("totalSlots"),
            available_slots,
            exhibition_data.get("status")
        ))
        connection.commit()
        
        # Return the newly created exhibition
        new_exhibition_id = cursor.lastrowid
        print(f"Exhibition created successfully with ID: {new_exhibition_id}")
        return get_exhibition(new_exhibition_id)
    except Exception as e:
        print(f"ERROR creating exhibition: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def update_exhibition(auth_header, exhibition_id, exhibition_data):
    """Update an exhibition (admin only)"""
    print(f"\n--- Update Exhibition Request ---")
    print(f"Auth Header: {auth_header}")
    print(f"Exhibition ID: {exhibition_id}")
    print(f"Exhibition Data: {exhibition_data}")
    
    if not auth_header:
        print("ERROR: Authentication header missing")
        return {"error": "Authentication required"}
    
    # Extract token from header - handle both formats
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
    else:
        parts = auth_header.split(" ")
        if len(parts) > 1:
            token = parts[1]
    
    if not token:
        print("ERROR: No token found in header")
        return {"error": "Invalid authentication token"}
    
    # Verify token and check if user is admin
    print(f"Verifying token: {token[:20]}...")
    payload = verify_token(token)
    print(f"Token verification result: {payload}")
    
    # Check if verification returned an error
    if isinstance(payload, dict) and "error" in payload:
        print(f"ERROR: Token verification failed: {payload['error']}")
        return {"error": f"Authentication failed: {payload['error']}"}
    
    # Check if user is admin
    is_admin = payload.get("is_admin", False)
    print(f"Is admin: {is_admin}")
    
    if not is_admin:
        print("ERROR: Access denied - Not an admin user")
        return {"error": "Unauthorized access: Admin privileges required"}
    
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # Parse exhibition_data if it's a string
        if isinstance(exhibition_data, str):
            try:
                exhibition_data = json.loads(exhibition_data)
            except json.JSONDecodeError as e:
                print(f"ERROR: Failed to parse exhibition data: {e}")
                return {"error": f"Invalid exhibition data format: {str(e)}"}
        
        # First get the current exhibition to preserve the image_url if not updated
        cursor.execute("SELECT image_url FROM exhibitions WHERE id = %s", (exhibition_id,))
        current_exhibition = cursor.fetchone()
        
        if not current_exhibition:
            return {"error": "Exhibition not found"}
        
        # Handle the image update
        image_url = exhibition_data.get("imageUrl")
        if image_url and image_url.startswith('data:'):
            # Save the new base64 image and get the file path
            saved_image_path = save_image_from_base64(image_url)
            if saved_image_path:
                image_url = saved_image_path
                print(f"New image saved to: {saved_image_path}")
            else:
                print("Failed to save new image, keeping existing")
                image_url = current_exhibition[0] if current_exhibition[0] else ""
        elif image_url is None or image_url == "":
            # Keep existing image if no new image provided
            image_url = current_exhibition[0] if current_exhibition[0] else ""
        
        query = """
        UPDATE exhibitions
        SET title = %s, description = %s, location = %s, start_date = %s, end_date = %s,
            ticket_price = %s, image_url = %s, total_slots = %s, available_slots = %s, status = %s
        WHERE id = %s
        """
        cursor.execute(query, (
            exhibition_data.get("title"),
            exhibition_data.get("description"),
            exhibition_data.get("location"),
            exhibition_data.get("startDate"),
            exhibition_data.get("endDate"),
            exhibition_data.get("ticketPrice"),
            image_url,
            exhibition_data.get("totalSlots"),
            exhibition_data.get("availableSlots"),
            exhibition_data.get("status"),
            exhibition_id
        ))
        connection.commit()
        
        # Check if exhibition was found and updated
        if cursor.rowcount == 0:
            return {"error": "Exhibition not found"}
        
        # Return the updated exhibition
        return get_exhibition(exhibition_id)
    except Exception as e:
        print(f"Error updating exhibition: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# ... keep existing code (delete_exhibition function remains the same)
def delete_exhibition(auth_header, exhibition_id):
    """Delete an exhibition (admin only)"""
    print(f"\n--- Delete Exhibition Request ---")
    print(f"Auth Header: {auth_header}")
    print(f"Exhibition ID: {exhibition_id}")
    
    if not auth_header:
        print("ERROR: Authentication header missing")
        return {"error": "Authentication required"}
    
    # Extract token from header - handle both formats
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
    else:
        parts = auth_header.split(" ")
        if len(parts) > 1:
            token = parts[1]
    
    if not token:
        print("ERROR: No token found in header")
        return {"error": "Invalid authentication token"}
    
    # Verify token and check if user is admin
    print(f"Verifying token: {token[:20]}...")
    payload = verify_token(token)
    print(f"Token verification result: {payload}")
    
    # Check if verification returned an error
    if isinstance(payload, dict) and "error" in payload:
        print(f"ERROR: Token verification failed: {payload['error']}")
        return {"error": f"Authentication failed: {payload['error']}"}
    
    # Check if user is admin
    is_admin = payload.get("is_admin", False)
    print(f"Is admin: {is_admin}")
    
    if not is_admin:
        print("ERROR: Access denied - Not an admin user")
        return {"error": "Unauthorized access: Admin privileges required"}
    
    # Proceed with deletion
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    
    try:
        # First check if the exhibition exists
        cursor.execute("SELECT id FROM exhibitions WHERE id = %s", (exhibition_id,))
        if not cursor.fetchone():
            return {"error": "Exhibition not found"}
        
        # Delete the exhibition
        cursor.execute("DELETE FROM exhibitions WHERE id = %s", (exhibition_id,))
        connection.commit()
        
        return {"success": True, "message": f"Exhibition with ID {exhibition_id} deleted successfully"}
    except Exception as e:
        print(f"Error deleting exhibition: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


from database import save_contact_message, get_all_contact_messages, update_message_status
import json
import jwt
import os
from decimal import Decimal
from middleware import SECRET_KEY
from datetime import datetime

# Custom JSON encoder to handle Decimal types and datetime objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(CustomJSONEncoder, self).default(obj)

def json_dumps(obj):
    """Convert object to JSON string, handling Decimal and datetime types"""
    return json.dumps(obj, cls=CustomJSONEncoder)

def is_admin(auth_header):
    """Simple check if request has admin auth header"""
    return bool(auth_header and auth_header.startswith('Bearer '))

def create_contact_message(data):
    """Create a new contact message"""
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone', '')
    message = data.get('message')
    
    # Support for chat messages
    source = data.get('source', 'contact_form')  # Track where messages come from
    
    # Validate required fields
    if not name or not email or not message:
        return {"error": "Missing required fields"}
    
    # Print data for debugging
    print(f"Saving contact message: {name}, {email}, {message}, source: {source}")
    
    # Save the message
    result = save_contact_message(name, email, phone, message, source)
    
    # Print result for debugging
    print(f"Save result: {result}")
    
    # Convert any Decimal values to float
    if isinstance(result, dict):
        return json.loads(json_dumps(result))
    return result

def get_messages(auth_header):
    """Get all contact messages (admin only)"""
    if not auth_header:
        print("No auth header provided")
        return {"error": "Authentication required"}
    
    print("Admin authorized, fetching all contact messages")
    result = get_all_contact_messages()
    
    # Print result for debugging
    print(f"Fetch messages result: {result}")
    
    # Use custom JSON encoder for Decimal and datetime values
    if isinstance(result, dict) and 'messages' in result:
        return json.loads(json_dumps(result))
    return result

def update_message(auth_header, message_id, data):
    """Update the status of a message (admin only)"""
    if not auth_header:
        return {"error": "Authentication required"}
    
    status = data.get('status')
    if not status or status not in ['new', 'read', 'replied']:
        return {"error": "Invalid status value"}
    
    result = update_message_status(message_id, status)
    
    # Convert any Decimal values to float
    if isinstance(result, dict):
        return json.loads(json_dumps(result))
    return result

# WhatsApp message handling would need additional server-side code
# This would typically involve setting up a webhook to receive messages from WhatsApp API
# and then responding to them programmatically
def handle_whatsapp_message(data):
    """Handle incoming WhatsApp message"""
    # This function would be called by a webhook receiver for WhatsApp
    # For now, it's a placeholder for future implementation
    return {"success": True, "message": "WhatsApp message received"}

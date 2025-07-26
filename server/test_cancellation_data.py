#!/usr/bin/env python3

import sys
import os

# Add the current directory to Python path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db_connection
from cancellation import get_all_cancellation_requests

def test_cancellation_table():
    """Test the cancellation table structure and data"""
    connection = get_db_connection()
    if connection is None:
        print("❌ Database connection failed")
        return
    
    cursor = connection.cursor()
    
    try:
        # Check if cancellation table exists
        cursor.execute("SHOW TABLES LIKE 'ticket_cancellation_requests'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("❌ ticket_cancellation_requests table does not exist")
            return
        
        print("✅ ticket_cancellation_requests table exists")
        
        # Check table structure
        cursor.execute("DESCRIBE ticket_cancellation_requests")
        columns = cursor.fetchall()
        print("\n📋 Table structure:")
        for col in columns:
            print(f"   {col[0]} - {col[1]}")
        
        # Check if there's any data
        cursor.execute("SELECT COUNT(*) FROM ticket_cancellation_requests")
        count = cursor.fetchone()[0]
        print(f"\n📊 Total cancellation requests: {count}")
        
        if count > 0:
            # Show sample data
            cursor.execute("SELECT * FROM ticket_cancellation_requests LIMIT 3")
            sample_data = cursor.fetchall()
            print("\n📝 Sample data:")
            for row in sample_data:
                print(f"   ID: {row[0]}, User ID: {row[1]}, Status: {row[6]}, Reason: {row[4][:50]}...")
        
        # Test the get_all_cancellation_requests function
        print("\n🔍 Testing get_all_cancellation_requests() function...")
        result = get_all_cancellation_requests()
        
        if "error" in result:
            print(f"❌ Function returned error: {result['error']}")
        else:
            cancellations = result.get('cancellations', [])
            print(f"✅ Function returned {len(cancellations)} cancellation requests")
            
            if cancellations:
                print("\n📝 Sample cancellation data:")
                for i, cancellation in enumerate(cancellations[:2]):
                    print(f"   Cancellation {i+1}:")
                    print(f"     Ticket Code: {cancellation.get('ticket_code', 'N/A')}")
                    print(f"     User: {cancellation.get('user_name', 'N/A')}")
                    print(f"     Status: {cancellation.get('status', 'N/A')}")
                    print(f"     Reason: {cancellation.get('reason', 'N/A')[:50]}...")
        
    except Exception as e:
        print(f"❌ Error testing cancellation data: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    test_cancellation_table()
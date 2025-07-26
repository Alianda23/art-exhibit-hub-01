
import hashlib
import sys
from db_setup import get_db_connection
from mysql.connector import Error

def hash_password(password):
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_admin(name, email, password):
    """Create a new admin user"""
    connection = get_db_connection()
    if connection is None:
        return {"error": "Database connection failed"}
    
    cursor = connection.cursor()
    hashed_password = hash_password(password)
    
    try:
        # Check if email already exists
        cursor.execute("SELECT id FROM admins WHERE email = %s", (email,))
        if cursor.fetchone():
            return {"error": "Admin email already exists"}
        
        # Insert the new admin
        query = """
        INSERT INTO admins (name, email, password)
        VALUES (%s, %s, %s)
        """
        cursor.execute(query, (name, email, hashed_password))
        connection.commit()
        
        # Get the new user ID and convert to string for consistency
        admin_id = str(cursor.lastrowid)
        
        return {
            "success": True,
            "admin_id": admin_id,
            "name": name
        }
    except Error as e:
        print(f"Error creating admin: {e}")
        return {"error": str(e)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def main():
    print("=== Create Admin User ===")
    name = input("Enter admin name: ")
    email = input("Enter admin email: ")
    password = input("Enter admin password: ")
    
    result = create_admin(name, email, password)
    
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print(f"Admin created successfully with ID: {result['admin_id']}")
        print(f"Name: {result['name']}")

if __name__ == "__main__":
    main()


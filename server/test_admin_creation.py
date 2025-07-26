#!/usr/bin/env python3

import sys
import os

# Add the current directory to Python path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from create_admin import create_admin

def main():
    print("Creating a test admin user...")
    
    # Create admin with credentials
    result = create_admin(
        name="Admin User",
        email="admin@gallery.com", 
        password="admin123"
    )
    
    if "error" in result:
        print(f"Error creating admin: {result['error']}")
    else:
        print(f"✅ Admin created successfully!")
        print(f"   Name: {result['name']}")
        print(f"   Admin ID: {result['admin_id']}")
        print("\nLogin credentials:")
        print("   Email: admin@gallery.com")
        print("   Password: admin123")
        print("\nNow you can login to the admin panel!")

if __name__ == "__main__":
    main()
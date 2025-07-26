
from auth import create_admin

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

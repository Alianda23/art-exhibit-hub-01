
# AfriArt Backend

This backend is built with Python and MySQL, providing API endpoints for the AfriArt gallery web application.

## Setup Instructions

### 1. Create MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# In MySQL console, run the schema.sql script
source schema.sql
```

Alternatively, you can run:

```bash
mysql -u root -p < schema.sql
```

### 2. Install Required Python Packages

```bash
pip install mysql-connector-python PyJWT
```

### 3. Configure Database Connection

Edit the `database.py` file to update your MySQL credentials:

```python
# Database connection configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',  # Update with your MySQL username
    'password': '',  # Update with your MySQL password
    'database': 'afriart_db'
}
```

### 4. Create Admin User

Run the script to create an admin user:

```bash
python add_admin.py
```

Follow the prompts to create your admin credentials.

### 5. Start the Server

```bash
python server.py
```

The server will run on http://localhost:8000 by default.

## API Endpoints

### Authentication

- POST `/register` - Register a new user
- POST `/login` - User login
- POST `/admin-login` - Admin login

### Artworks

- GET `/artworks` - Get all artworks
- GET `/artworks/:id` - Get a specific artwork
- POST `/artworks` - Create a new artwork (admin only)
- PUT `/artworks/:id` - Update an artwork (admin only)
- DELETE `/artworks/:id` - Delete an artwork (admin only)

### Exhibitions

- GET `/exhibitions` - Get all exhibitions
- GET `/exhibitions/:id` - Get a specific exhibition
- POST `/exhibitions` - Create a new exhibition (admin only)
- PUT `/exhibitions/:id` - Update an exhibition (admin only)
- DELETE `/exhibitions/:id` - Delete an exhibition (admin only)

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Security Note

In a production environment, you should:
1. Use HTTPS
2. Store sensitive data securely
3. Use a strong, randomly generated secret key for JWT
4. Implement rate limiting and other security measures

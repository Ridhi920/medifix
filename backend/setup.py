#!/usr/bin/env python3
"""
Setup script for Medifix backend.
This script helps initialize the database and generate a secure secret key.
"""

import os
import secrets
import subprocess
import sys


def generate_secret_key():
    """Generate a secure random secret key."""
    return secrets.token_hex(32)


def create_env_file():
    """Create .env file from .env.example if it doesn't exist."""
    if os.path.exists(".env"):
        print("✓ .env file already exists")
        return

    if not os.path.exists(".env.example"):
        print("✗ .env.example file not found")
        return

    # Read .env.example
    with open(".env.example", "r") as f:
        content = f.read()

    # Generate secret key
    secret_key = generate_secret_key()

    # Replace placeholders
    content = content.replace(
        "your-secret-key-here-change-this-in-production",
        secret_key
    )

    # Write .env file
    with open(".env", "w") as f:
        f.write(content)

    print("✓ Created .env file with generated secret key")
    print(f"  Secret key: {secret_key[:20]}...")


def check_postgresql():
    """Check if PostgreSQL is installed and running."""
    try:
        result = subprocess.run(
            ["psql", "--version"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"✓ PostgreSQL is installed: {result.stdout.strip()}")
            return True
        else:
            print("✗ PostgreSQL not found")
            return False
    except FileNotFoundError:
        print("✗ PostgreSQL not found")
        print("  Install with: brew install postgresql@16  (macOS)")
        print("  or: sudo apt install postgresql  (Ubuntu/Debian)")
        return False


def check_database_connection():
    """Check if database connection is possible."""
    try:
        from dotenv import load_dotenv
        load_dotenv()

        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            print("✗ DATABASE_URL not set in .env file")
            return False

        print(f"✓ DATABASE_URL configured")
        return True
    except Exception as e:
        print(f"✗ Error checking database: {e}")
        return False


def install_dependencies():
    """Check if dependencies are installed."""
    try:
        import fastapi
        import sqlmodel
        import psycopg2
        print("✓ All dependencies installed")
        return True
    except ImportError as e:
        print(f"✗ Missing dependencies: {e}")
        print("  Run: pip install -r requirements.txt")
        return False


def main():
    """Main setup function."""
    print("=" * 50)
    print("Medifix Backend Setup")
    print("=" * 50)
    print()

    # Check Python version
    if sys.version_info < (3, 10):
        print("✗ Python 3.10 or higher is required")
        sys.exit(1)
    print(f"✓ Python version: {sys.version.split()[0]}")

    # Check PostgreSQL
    check_postgresql()

    # Create .env file
    create_env_file()

    # Check database connection
    check_database_connection()

    # Check dependencies
    deps_ok = install_dependencies()

    print()
    print("=" * 50)
    print("Setup Complete!")
    print("=" * 50)
    print()

    if deps_ok:
        print("Next steps:")
        print("1. Create PostgreSQL database:")
        print("   psql postgres")
        print("   CREATE DATABASE medifix;")
        print("   CREATE USER medifix WITH PASSWORD 'medifix';")
        print("   GRANT ALL PRIVILEGES ON DATABASE medifix TO medifix;")
        print()
        print("2. Run the application:")
        print("   uvicorn app.main:app --reload")
        print()
        print("3. Visit: http://localhost:8000/docs")
    else:
        print("Please install dependencies first:")
        print("   pip install -r requirements.txt")


if __name__ == "__main__":
    main()

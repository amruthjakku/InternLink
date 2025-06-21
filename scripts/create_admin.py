#!/usr/bin/env python3
"""
Admin Bootstrap Script for Internship Tracker

Usage:
    python create_admin.py --gitlab_username=amruthjakku --name="Amruth Jakku" --email="amruth@example.com"

This script creates the first admin user in the database.
"""

import argparse
import sys
import os
from pymongo import MongoClient
from datetime import datetime
import urllib.parse

def get_mongodb_uri():
    """Get MongoDB URI from environment or use default"""
    # Try to read from .env.local file
    env_file = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if line.startswith('MONGODB_URI='):
                    return line.split('=', 1)[1].strip()
    
    # Fallback to environment variable
    return os.getenv('MONGODB_URI', 'mongodb://localhost:27017/internship_tracker')

def create_admin(gitlab_username, name, email, gitlab_id=None):
    """Create the first admin user"""
    
    # Connect to MongoDB
    mongodb_uri = get_mongodb_uri()
    client = MongoClient(mongodb_uri)
    
    try:
        # Get database name from URI or use default
        if 'mongodb+srv://' in mongodb_uri or 'mongodb://' in mongodb_uri:
            # Extract database name from URI
            parsed = urllib.parse.urlparse(mongodb_uri)
            db_name = parsed.path.lstrip('/') if parsed.path else 'internship_tracker'
        else:
            db_name = 'internship_tracker'
        
        db = client[db_name]
        users_collection = db.users
        
        # Check if admin already exists
        existing_admin = users_collection.find_one({
            'gitlabUsername': gitlab_username.lower()
        })
        
        if existing_admin:
            print(f"❌ Admin with GitLab username '{gitlab_username}' already exists!")
            return False
        
        # Check if any admin exists
        existing_admins = users_collection.count_documents({'role': 'admin'})
        
        # Create admin user
        admin_user = {
            'gitlabUsername': gitlab_username.lower(),
            'gitlabId': gitlab_id or f"admin_{gitlab_username.lower()}",
            'name': name,
            'email': email.lower(),
            'role': 'admin',
            'assignedBy': 'system_bootstrap',
            'isActive': True,
            'profileImage': None,
            'lastLoginAt': None,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        # Insert admin user
        result = users_collection.insert_one(admin_user)
        
        if result.inserted_id:
            print(f"✅ Successfully created admin user!")
            print(f"   GitLab Username: {gitlab_username}")
            print(f"   Name: {name}")
            print(f"   Email: {email}")
            print(f"   Role: admin")
            print(f"   User ID: {result.inserted_id}")
            
            if existing_admins == 0:
                print(f"🎉 This is the first admin user in the system!")
            else:
                print(f"📊 Total admins in system: {existing_admins + 1}")
            
            return True
        else:
            print(f"❌ Failed to create admin user!")
            return False
            
    except Exception as e:
        print(f"❌ Error creating admin: {str(e)}")
        return False
    finally:
        client.close()

def main():
    parser = argparse.ArgumentParser(
        description='Create the first admin user for Internship Tracker'
    )
    parser.add_argument(
        '--gitlab_username',
        required=True,
        help='GitLab username of the admin user'
    )
    parser.add_argument(
        '--name',
        required=True,
        help='Full name of the admin user'
    )
    parser.add_argument(
        '--email',
        required=True,
        help='Email address of the admin user'
    )
    parser.add_argument(
        '--gitlab_id',
        help='GitLab user ID (optional, will be auto-generated if not provided)'
    )
    
    args = parser.parse_args()
    
    print("🚀 Creating admin user for Internship Tracker...")
    print(f"   GitLab Username: {args.gitlab_username}")
    print(f"   Name: {args.name}")
    print(f"   Email: {args.email}")
    print()
    
    success = create_admin(
        gitlab_username=args.gitlab_username,
        name=args.name,
        email=args.email,
        gitlab_id=args.gitlab_id
    )
    
    if success:
        print()
        print("🎯 Next Steps:")
        print("1. Start your Next.js application")
        print("2. Login with your GitLab account")
        print("3. You'll be automatically recognized as an admin")
        print("4. Use the admin dashboard to add mentors and colleges")
        sys.exit(0)
    else:
        print()
        print("❌ Failed to create admin user. Please check the error above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
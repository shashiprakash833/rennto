import os

def find_file(name, path):
    for root, dirs, files in os.walk(path):
        if name in files:
            pass

find_file('admin_services.py', r'C:\Users\pasam\OneDrive\Desktop\intern-otms\BackendServer')
find_file('admin_service.py', r'C:\Users\pasam\OneDrive\Desktop\intern-otms\BackendServer')

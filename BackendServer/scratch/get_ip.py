import socket

def get_local_ip():
    try:
        # Create a dummy socket connection to detect primary interface IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        return f"Error: {e}"

_ = get_local_ip()

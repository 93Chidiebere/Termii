import base64
from py_vapid import Vapid
from cryptography.hazmat.primitives import serialization

# Initialize Vapid
v = Vapid()
v.generate_keys()

# Get raw private bytes
private_bytes = v.private_key.private_bytes(
    encoding=serialization.Encoding.DER,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

# Get raw public bytes using the correct modern attribute name
public_bytes = v.public_key.public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint
)

# Encode to standard URL-Safe Base64 strings used for Web Push
vapid_private = base64.urlsafe_b64encode(private_bytes).decode('utf-8').rstrip('=')
vapid_public = base64.urlsafe_b64encode(public_bytes).decode('utf-8').rstrip('=')

print("--- COPY YOUR KEYS BELOW ---")
print(f"VAPID_PUBLIC_KEY={vapid_public}")
print(f"VAPID_PRIVATE_KEY={vapid_private}")
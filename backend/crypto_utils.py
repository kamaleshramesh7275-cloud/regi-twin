import os
import base64
import hashlib
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

def _get_encryption_key(secret_env: str = "GHA_TOKEN_ENCRYPTION_SECRET") -> bytes:
    """
    Retrieves the symmetric encryption key from environment variable (default: GHA_TOKEN_ENCRYPTION_SECRET, fallback: HEVY_KEY_ENCRYPTION_SECRET).
    If not explicitly configured, falls back to a deterministic machine/app secret key
    so that local testing and runs remain functional without plaintext leak.
    """
    secret = os.environ.get(secret_env) or os.environ.get("GHA_TOKEN_ENCRYPTION_SECRET") or os.environ.get("HEVY_KEY_ENCRYPTION_SECRET")
    if secret:
        # If it's already a valid 32-byte url-safe base64 string, use it
        try:
            # Validate Fernet key
            Fernet(secret.encode("utf-8"))
            return secret.encode("utf-8")
        except Exception:
            # If a plain passphrase was provided, derive a valid 32-byte urlsafe base64 key using sha256
            key_digest = hashlib.sha256(secret.encode("utf-8")).digest()
            return base64.urlsafe_b64encode(key_digest)
    
    # Deterministic fallback secret for development
    fallback_seed = f"physiotwin-{secret_env}-token-secure-salt-2026"
    key_digest = hashlib.sha256(fallback_seed.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(key_digest)


def encrypt_secret(plain_text: str, secret_env: str = "GHA_TOKEN_ENCRYPTION_SECRET") -> str:
    """
    Encrypts a plaintext string (such as an OAuth refresh token or Hevy API key) at rest using Fernet.
    """
    if not plain_text:
        return ""
    key = _get_encryption_key(secret_env)
    f = Fernet(key)
    return f.encrypt(plain_text.strip().encode("utf-8")).decode("utf-8")


def decrypt_secret(cipher_text: str, secret_env: str = "GHA_TOKEN_ENCRYPTION_SECRET") -> str:
    """
    Decrypts an encrypted token. Returns plaintext string.
    """
    if not cipher_text:
        return ""
    key = _get_encryption_key(secret_env)
    f = Fernet(key)
    try:
        return f.decrypt(cipher_text.encode("utf-8")).decode("utf-8")
    except Exception as e:
        print(f"Decryption error: {e}")
        return ""


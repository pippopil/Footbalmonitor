"""
Security utilities: token masking, webhook secret verification, and authentication helpers.
"""
import os
import hmac
import hashlib
from typing import Optional

WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "footbalmonitor_secret_key_change_in_prod")

def mask_token(token: Optional[str]) -> str:
    """
    Mask sensitive tokens (e.g. Telegram Bot tokens or API keys) for safe display and logging.
    Example: '123456789:ABCdefGHI' -> '123456...GHI'
    """
    if not token or len(token) < 10:
        return "***"
    prefix = token[:6]
    suffix = token[-4:]
    return f"{prefix}...{suffix}"

def verify_webhook_signature(payload_bytes: bytes, signature_header: str, secret: Optional[str] = None) -> bool:
    """
    Verifies HMAC-SHA256 signature for incoming webhooks (e.g. from Flashscore/Sofascore relays).
    """
    key = (secret or WEBHOOK_SECRET).encode('utf-8')
    computed_signature = hmac.new(key, payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed_signature, signature_header.strip())

def verify_webhook_secret_header(header_secret: Optional[str], expected_secret: Optional[str] = None) -> bool:
    """
    Simple constant-time string comparison for secret header tokens (X-Webhook-Secret).
    """
    expected = expected_secret or WEBHOOK_SECRET
    if not header_secret or not expected:
        return False
    return hmac.compare_digest(header_secret.strip(), expected.strip())

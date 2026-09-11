"""
role_auth.py — Firebase ID-token verification + role-based FastAPI dependency factories.

Usage in endpoints:
    @app.get("/admin/stats")
    def admin_stats(caller=Depends(require_role("superadmin"))):
        ...

    @app.get("/clinician/clients")
    def get_clients(caller=Depends(require_any_role(["clinician","superadmin"]))):
        ...

The `caller` dict has keys: uid, email, role, token_claims (full decoded token).
"""
from __future__ import annotations

import json
import os
import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Firebase Admin SDK initialisation (best-effort)
# ──────────────────────────────────────────────────────────────────────────────
_firebase_app = None
_firebase_available = False

def _init_firebase():
    global _firebase_app, _firebase_available
    if _firebase_app is not None:
        return

    try:
        import firebase_admin
        from firebase_admin import credentials, auth as fb_auth  # noqa: F401

        # Prefer a service-account JSON file path / inline JSON from env
        sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "")
        sa_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")

        if sa_json:
            sa_dict = json.loads(sa_json)
            cred = credentials.Certificate(sa_dict)
            _firebase_app = firebase_admin.initialize_app(cred)
            _firebase_available = True
            logger.info("[role_auth] Firebase Admin initialised from FIREBASE_SERVICE_ACCOUNT_JSON")
        elif sa_path and os.path.exists(sa_path):
            cred = credentials.Certificate(sa_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            _firebase_available = True
            logger.info("[role_auth] Firebase Admin initialised from FIREBASE_SERVICE_ACCOUNT_PATH")
        else:
            # No service account → fall back to project-id only (token verification still
            # works for RS256 tokens via the public-key endpoint, but custom claims cannot
            # be SET — only READ if they're already on the token).
            project_id = os.environ.get("VITE_FIREBASE_PROJECT_ID") or os.environ.get(
                "FIREBASE_PROJECT_ID", ""
            )
            if project_id:
                _firebase_app = firebase_admin.initialize_app(
                    options={"projectId": project_id}
                )
                _firebase_available = True
                logger.warning(
                    "[role_auth] Firebase Admin initialised WITHOUT service account. "
                    "Token verification only — cannot set custom claims."
                )
            else:
                logger.warning(
                    "[role_auth] Firebase Admin NOT initialised — no credentials found. "
                    "All role checks will run in DEV-BYPASS mode."
                )
    except Exception as exc:
        logger.warning(f"[role_auth] Firebase Admin init error: {exc}")


# ──────────────────────────────────────────────────────────────────────────────
# Token verification
# ──────────────────────────────────────────────────────────────────────────────
_bearer = HTTPBearer(auto_error=False)


def _verify_token(token: str) -> Optional[dict]:
    """Verify a Firebase ID token and return the decoded claims dict, or None on failure."""
    _init_firebase()
    if not _firebase_available:
        return None

    try:
        from firebase_admin import auth as fb_auth
        decoded = fb_auth.verify_id_token(token)
        return decoded
    except Exception as exc:
        logger.debug(f"[role_auth] Token verification failed: {exc}")
        return None


def _extract_role_from_claims(claims: dict) -> str:
    """Read role from custom claims, fall back to 'client'."""
    return claims.get("role", "client")


# ──────────────────────────────────────────────────────────────────────────────
# Set custom claims (requires service account)
# ──────────────────────────────────────────────────────────────────────────────

def set_user_role(uid: str, role: str) -> bool:
    """
    Set a Firebase custom claim `role` for a user.
    Returns True on success, False if Firebase Admin is unavailable or SA is missing.
    """
    _init_firebase()
    if not _firebase_available:
        logger.warning("[role_auth] set_user_role called but Firebase Admin unavailable.")
        return False
    try:
        from firebase_admin import auth as fb_auth
        # Preserve existing claims and just update role
        user = fb_auth.get_user(uid)
        current_claims = user.custom_claims or {}
        current_claims["role"] = role
        fb_auth.set_custom_user_claims(uid, current_claims)
        logger.info(f"[role_auth] Set role='{role}' for uid={uid}")
        return True
    except Exception as exc:
        logger.error(f"[role_auth] Failed to set role for {uid}: {exc}")
        return False


def get_firebase_user_by_email(email: str) -> Optional[dict]:
    """Look up a Firebase user by email. Returns basic user info dict or None."""
    _init_firebase()
    if not _firebase_available:
        return None
    try:
        from firebase_admin import auth as fb_auth
        user = fb_auth.get_user_by_email(email)
        claims = user.custom_claims or {}
        return {
            "uid": user.uid,
            "email": user.email,
            "display_name": user.display_name,
            "role": claims.get("role", "client"),
            "disabled": user.disabled,
            "email_verified": user.email_verified,
            "created_at": user.user_metadata.creation_timestamp,
        }
    except Exception:
        return None


def list_firebase_users(max_results: int = 1000) -> list:
    """List Firebase Auth users with their custom claims. Requires service account."""
    _init_firebase()
    if not _firebase_available:
        return []
    try:
        from firebase_admin import auth as fb_auth
        page = fb_auth.list_users(max_results=max_results)
        users = []
        for u in page.users:
            claims = u.custom_claims or {}
            users.append({
                "uid": u.uid,
                "email": u.email or "",
                "display_name": u.display_name or "",
                "role": claims.get("role", "client"),
                "disabled": u.disabled,
                "email_verified": u.email_verified,
                "created_at": u.user_metadata.creation_timestamp,
            })
        return users
    except Exception as exc:
        logger.error(f"[role_auth] list_firebase_users failed: {exc}")
        return []


# ──────────────────────────────────────────────────────────────────────────────
# FastAPI dependency factories
# ──────────────────────────────────────────────────────────────────────────────

_DEV_BYPASS_UID = "dev-bypass-user"
_DEV_BYPASS_ROLE = os.environ.get("DEV_BYPASS_ROLE", "superadmin")


def _build_caller(decoded: dict) -> dict:
    return {
        "uid": decoded.get("uid") or decoded.get("user_id", ""),
        "email": decoded.get("email", ""),
        "role": _extract_role_from_claims(decoded),
        "token_claims": decoded,
    }


def _dev_bypass_caller(required_role: str) -> dict:
    """When Firebase is not configured, return a bypass caller (dev/test only)."""
    return {
        "uid": _DEV_BYPASS_UID,
        "email": "dev@physiotwin.local",
        "role": _DEV_BYPASS_ROLE,
        "token_claims": {"role": _DEV_BYPASS_ROLE},
        "_dev_bypass": True,
    }


def require_role(role: str):
    """
    FastAPI dependency: verifies Firebase ID token and asserts caller has exactly `role`
    (or superadmin, which passes all checks).

    Example:
        @app.get("/admin/stats")
        def stats(caller=Depends(require_role("superadmin"))):
            ...
    """
    def dependency(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    ):
        if credentials is None:
            if not _firebase_available:
                # Dev mode with no Firebase configured — let through with warning
                logger.warning("[role_auth] DEV BYPASS: no token, Firebase not configured.")
                caller = _dev_bypass_caller(role)
                # Still enforce role in dev bypass
                if caller["role"] != role and caller["role"] != "superadmin":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Requires role '{role}', dev bypass has role '{caller['role']}'.",
                    )
                return caller
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = credentials.credentials
        decoded = _verify_token(token)

        if decoded is None:
            if not _firebase_available:
                logger.warning("[role_auth] DEV BYPASS: token unverifiable, Firebase not configured.")
                return _dev_bypass_caller(role)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
            )

        caller = _build_caller(decoded)
        caller_role = caller["role"]

        # superadmin passes every role check
        if caller_role == "superadmin":
            return caller

        if caller_role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role '{role}'. Your role is '{caller_role}'.",
            )
        return caller

    return dependency


def require_any_role(roles: list[str]):
    """
    FastAPI dependency: asserts caller has any of the listed roles (or superadmin).

    Example:
        @app.get("/clinician/clients")
        def get_clients(caller=Depends(require_any_role(["clinician","superadmin"]))):
            ...
    """
    def dependency(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    ):
        if credentials is None:
            if not _firebase_available:
                caller = _dev_bypass_caller(roles[0])
                if caller["role"] not in roles and caller["role"] != "superadmin":
                    raise HTTPException(status_code=403, detail=f"Requires one of {roles}.")
                return caller
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = credentials.credentials
        decoded = _verify_token(token)

        if decoded is None:
            if not _firebase_available:
                return _dev_bypass_caller(roles[0])
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
            )

        caller = _build_caller(decoded)
        caller_role = caller["role"]

        if caller_role == "superadmin" or caller_role in roles:
            return caller

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires one of roles {roles}. Your role is '{caller_role}'.",
        )

    return dependency


def get_optional_caller():
    """
    FastAPI dependency: returns caller info if a valid token is present, or None.
    Useful for endpoints that optionally use auth context (e.g. public + auth paths).
    """
    def dependency(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    ):
        if credentials is None:
            return None
        token = credentials.credentials
        decoded = _verify_token(token)
        if decoded is None:
            return None
        return _build_caller(decoded)

    return dependency

from django.core import signing
from rest_framework import authentication, exceptions
from rest_framework.throttling import AnonRateThrottle

from .models import Utilisateur

TOKEN_SALT = 'monespace-auth'
TOKEN_MAX_AGE = 60 * 60 * 24 * 30  # 30 jours


def make_token(user):
    """Jeton signé avec SECRET_KEY : impossible à fabriquer sans cette clé."""
    return signing.dumps({'uid': user.id}, salt=TOKEN_SALT)


class SignedTokenAuthentication(authentication.BaseAuthentication):
    """Lit l'en-tête « Authorization: Token <jeton> » et retourne l'utilisateur."""

    def authenticate(self, request):
        parts = authentication.get_authorization_header(request).split()
        if not parts or parts[0].lower() not in (b'token', b'bearer'):
            return None
        if len(parts) != 2:
            raise exceptions.AuthenticationFailed('En-tête Authorization invalide.')
        try:
            data = signing.loads(parts[1].decode(), salt=TOKEN_SALT, max_age=TOKEN_MAX_AGE)
        except (signing.BadSignature, UnicodeError):  # inclut SignatureExpired
            raise exceptions.AuthenticationFailed('Session expirée ou invalide. Reconnectez-vous.')
        user = Utilisateur.objects.filter(id=data.get('uid'), email_verifie=True).first()
        if not user:
            raise exceptions.AuthenticationFailed('Compte introuvable.')
        return (user, parts[1].decode())

    def authenticate_header(self, request):
        return 'Token'  # fait répondre 401 (et non 403) quand on n'est pas connecté


class AuthThrottle(AnonRateThrottle):
    """Limite les tentatives sur login / inscription / codes (anti force brute)."""
    scope = 'auth'
    rate = '30/min'

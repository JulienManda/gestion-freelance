from django.core import signing
from rest_framework import authentication, exceptions
from rest_framework.throttling import AnonRateThrottle

from .models import Utilisateur

TOKEN_SALT = 'monespace-auth'
TOKEN_MAX_AGE = 60 * 60 * 24 * 30


def make_token(user):
    return signing.dumps({'uid': user.id}, salt=TOKEN_SALT)


class SignedTokenAuthentication(authentication.BaseAuthentication):

    def authenticate(self, request):
        parts = authentication.get_authorization_header(request).split()
        if not parts or parts[0].lower() not in (b'token', b'bearer'):
            return None
        if len(parts) != 2:
            raise exceptions.AuthenticationFailed('En-tête Authorization invalide.')
        try:
            data = signing.loads(parts[1].decode(), salt=TOKEN_SALT, max_age=TOKEN_MAX_AGE)
        except (signing.BadSignature, UnicodeError):
            raise exceptions.AuthenticationFailed('Session expirée ou invalide. Reconnectez-vous.')
        user = Utilisateur.objects.filter(id=data.get('uid'), email_verifie=True).first()
        if not user:
            raise exceptions.AuthenticationFailed('Compte introuvable.')
        return (user, parts[1].decode())

    def authenticate_header(self, request):
        return 'Token'


class AuthThrottle(AnonRateThrottle):
    scope = 'auth'
    rate = '30/min'

import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, identify_hasher, make_password
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Client, Service, Devis, LigneDevis, Facture, Paiement, Utilisateur, CodeVerification
from .mail import send_mail, MailError
from .serializers import (
    ClientSerializer, ServiceSerializer, DevisSerializer, 
    LigneDevisSerializer, FactureSerializer, PaiementSerializer
)

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

class DevisViewSet(viewsets.ModelViewSet):
    queryset = Devis.objects.all()
    serializer_class = DevisSerializer

class LigneDevisViewSet(viewsets.ModelViewSet):
    queryset = LigneDevis.objects.all()
    serializer_class = LigneDevisSerializer

class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.all()
    serializer_class = FactureSerializer

class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer


# --- AUTHENTIFICATION : inscription avec code email, mot de passe oublié ---

CODE_VALIDITE_MIN = 10
CODE_DELAI_RENVOI_S = 60
CODE_ESSAIS_MAX = 5
MDP_MIN = 8


def user_payload(user):
    return {
        'id': user.id,
        'username': user.nom_admin,
        'email': user.email,
        'nomEntreprise': user.nom_entreprise,
        'activite': user.activite,
        'telephone': user.telephone,
    }


def clean_email(value):
    return str(value or '').strip().lower()


def hash_code(email, purpose, code):
    msg = f"{email}:{purpose}:{code}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()


def password_ok(user, raw):
    """Vérifie le mot de passe. Les anciens comptes (mot de passe en clair) sont
    acceptés une dernière fois puis convertis automatiquement en mot de passe haché."""
    stored = user.mot_de_passe or ''
    try:
        identify_hasher(stored)
        return check_password(raw, stored)
    except ValueError:
        if hmac.compare_digest(stored.encode(), raw.encode()):
            user.mot_de_passe = make_password(raw)
            user.save(update_fields=['mot_de_passe'])
            return True
        return False


def issue_code(email, purpose):
    """Crée et envoie un code. Retourne False si un code a été envoyé il y a moins de 60 s."""
    existing = CodeVerification.objects.filter(email=email, purpose=purpose).first()
    if existing and (timezone.now() - existing.created_at).total_seconds() < CODE_DELAI_RENVOI_S:
        return False
    code = f"{secrets.randbelow(1_000_000):06d}"
    CodeVerification.objects.filter(email=email, purpose=purpose).delete()
    CodeVerification.objects.create(
        email=email, purpose=purpose, code_hash=hash_code(email, purpose, code),
        expires_at=timezone.now() + timedelta(minutes=CODE_VALIDITE_MIN),
    )
    titre = 'Confirmation de votre email' if purpose == 'VERIFY' else 'Réinitialisation de votre mot de passe'
    text = f"Votre code MonEspace : {code}\nIl est valable {CODE_VALIDITE_MIN} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message."
    html = (f"<div style='font-family:Arial,sans-serif'><h2>{titre}</h2>"
            f"<p>Votre code :</p><p style='font-size:32px;letter-spacing:6px;font-weight:bold'>{code}</p>"
            f"<p>Il est valable {CODE_VALIDITE_MIN} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p></div>")
    try:
        send_mail(email, f"MonEspace - {titre}", html, text)
    except MailError:
        CodeVerification.objects.filter(email=email, purpose=purpose).delete()
        raise
    return True


def check_code(email, purpose, code):
    """Retourne (ok, message_erreur). Un code est détruit après succès, expiration ou 5 échecs."""
    entry = CodeVerification.objects.filter(email=email, purpose=purpose).first()
    if not entry:
        return False, "Code invalide ou expiré. Demandez un nouveau code."
    if entry.expires_at < timezone.now() or entry.attempts >= CODE_ESSAIS_MAX:
        entry.delete()
        return False, "Code invalide ou expiré. Demandez un nouveau code."
    if not hmac.compare_digest(entry.code_hash, hash_code(email, purpose, str(code).strip())):
        entry.attempts += 1
        entry.save(update_fields=['attempts'])
        return False, "Code incorrect."
    entry.delete()
    return True, ''


def erreur_mail():
    return Response({'error': "Impossible d'envoyer l'email pour le moment. Réessayez plus tard."}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['POST'])
def register_view(request):
    nom_entreprise = request.data.get('nomEntreprise', 'MonEspace')
    nom_admin = request.data.get('username') or request.data.get('nomAdmin', 'Admin')
    email = clean_email(request.data.get('email'))
    mot_de_passe = request.data.get('password')
    activite = request.data.get('activite', 'Community Management & Design')
    telephone = request.data.get('telephone', '')

    if not email or not mot_de_passe:
        return Response({'error': "L'email et le mot de passe sont obligatoires."}, status=status.HTTP_400_BAD_REQUEST)
    if len(mot_de_passe) < MDP_MIN:
        return Response({'error': f"Le mot de passe doit contenir au moins {MDP_MIN} caractères."}, status=status.HTTP_400_BAD_REQUEST)

    user = Utilisateur.objects.filter(email__iexact=email).first()
    if user and user.email_verifie:
        return Response({'error': "Cet email est déjà associé à un compte."}, status=status.HTTP_400_BAD_REQUEST)

    if user:  # inscription précédente jamais confirmée : on la remplace
        user.nom_entreprise, user.nom_admin = nom_entreprise, nom_admin
        user.activite, user.telephone = activite, telephone
        user.mot_de_passe = make_password(mot_de_passe)
        user.save()
    else:
        user = Utilisateur.objects.create(
            nom_entreprise=nom_entreprise, nom_admin=nom_admin, email=email,
            mot_de_passe=make_password(mot_de_passe), activite=activite,
            telephone=telephone, email_verifie=False,
        )
    try:
        issue_code(email, 'VERIFY')
    except MailError:
        return erreur_mail()
    return Response({'success': True, 'email': email}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def verify_email_view(request):
    email = clean_email(request.data.get('email'))
    user = Utilisateur.objects.filter(email__iexact=email).first()
    if not user:
        return Response({'error': "Code invalide ou expiré. Demandez un nouveau code."}, status=status.HTTP_400_BAD_REQUEST)
    if not user.email_verifie:
        ok, msg = check_code(user.email, 'VERIFY', request.data.get('code', ''))
        if not ok:
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)
        user.email_verifie = True
        user.save(update_fields=['email_verifie'])
    else:
        return Response({'error': "Ce compte est déjà confirmé. Connectez-vous."}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'token': f"token-user-{user.id}", 'user': user_payload(user)})


@api_view(['POST'])
def resend_code_view(request):
    email = clean_email(request.data.get('email'))
    user = Utilisateur.objects.filter(email__iexact=email, email_verifie=False).first()
    if user:
        try:
            if not issue_code(user.email, 'VERIFY'):
                return Response({'error': "Patientez 60 secondes avant de redemander un code."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except MailError:
            return erreur_mail()
    return Response({'success': True})


@api_view(['POST'])
def forgot_password_view(request):
    email = clean_email(request.data.get('email'))
    user = Utilisateur.objects.filter(email__iexact=email).first()
    # Même réponse que l'email existe ou non, pour ne pas révéler quels comptes existent.
    if user:
        try:
            issue_code(user.email, 'RESET')
        except MailError:
            return erreur_mail()
    return Response({'success': True})


@api_view(['POST'])
def reset_password_view(request):
    email = clean_email(request.data.get('email'))
    password = request.data.get('password') or ''
    if len(password) < MDP_MIN:
        return Response({'error': f"Le mot de passe doit contenir au moins {MDP_MIN} caractères."}, status=status.HTTP_400_BAD_REQUEST)
    user = Utilisateur.objects.filter(email__iexact=email).first()
    if not user:
        return Response({'error': "Code invalide ou expiré. Demandez un nouveau code."}, status=status.HTTP_400_BAD_REQUEST)
    ok, msg = check_code(user.email, 'RESET', request.data.get('code', ''))
    if not ok:
        return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)
    user.mot_de_passe = make_password(password)
    user.email_verifie = True  # recevoir le code prouve que l'email est bien le sien
    user.save(update_fields=['mot_de_passe', 'email_verifie'])
    return Response({'success': True})


@api_view(['POST'])
def login_view(request):
    identifier = request.data.get('email') or request.data.get('username')
    mot_de_passe = request.data.get('password')

    if not identifier or not mot_de_passe:
        return Response({'error': "Veuillez remplir tous les champs."}, status=status.HTTP_400_BAD_REQUEST)

    identifier = str(identifier).strip()
    user = (Utilisateur.objects.filter(email__iexact=identifier).first()
            or Utilisateur.objects.filter(nom_admin=identifier).first())

    if not user or not password_ok(user, mot_de_passe):
        return Response({'error': "Identifiants ou mot de passe incorrect."}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.email_verifie:
        try:
            issue_code(user.email, 'VERIFY')
        except MailError:
            pass
        return Response({'error': "Email non confirmé.", 'needs_verification': True, 'email': user.email},
                        status=status.HTTP_403_FORBIDDEN)

    return Response({'token': f"token-user-{user.id}", 'user': user_payload(user)}, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
def profile_view(request):
    # Récupération de l'ID utilisateur à partir du token (ex: 'token-user-5' -> 5)
    auth_header = request.headers.get('Authorization', '')
    try:
        token_parts = auth_header.split('-')
        user_id = token_parts[-1]
        user = Utilisateur.objects.get(id=user_id)
    except (IndexError, Utilisateur.DoesNotExist):
        return Response({'error': 'Utilisateur non authentifié ou introuvable.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        return Response({
            'id': user.id,
            'username': user.nom_admin,
            'email': user.email,
            'nomEntreprise': user.nom_entreprise,
            'activite': user.activite,
            'telephone': user.telephone
        })

    elif request.method == 'PUT':
        user.nom_entreprise = request.data.get('nomEntreprise', user.nom_entreprise)
        user.nom_admin = request.data.get('username', user.nom_admin)
        user.email = request.data.get('email', user.email)
        user.activite = request.data.get('activite', user.activite)
        user.telephone = request.data.get('telephone', user.telephone)
        user.save()

        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.nom_admin,
                'email': user.email,
                'nomEntreprise': user.nom_entreprise,
                'activite': user.activite,
                'telephone': user.telephone
            }
        })
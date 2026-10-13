from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Client, Service, Devis, LigneDevis, Facture, Paiement, Utilisateur
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


# --- VUES D'AUTHENTIFICATION PERSONNALISÉES POUR LE MODÈLE UTILISATEUR ---

@api_view(['POST'])
def register_view(request):
    nom_entreprise = request.data.get('nomEntreprise', 'MonEspace')
    nom_admin = request.data.get('username') or request.data.get('nomAdmin', 'Admin')
    email = request.data.get('email')
    mot_de_passe = request.data.get('password')
    activite = request.data.get('activite', 'Community Management & Design')
    telephone = request.data.get('telephone', '')

    if not email or not mot_de_passe:
        return Response({'error': "L'email et le mot de passe sont obligatoires."}, status=status.HTTP_400_BAD_REQUEST)

    if Utilisateur.objects.filter(email=email).exists():
        return Response({'error': "Cet email est déjà associé à un compte."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Création de l'utilisateur dans la base de données
        user = Utilisateur.objects.create(
            nom_entreprise=nom_entreprise,
            nom_admin=nom_admin,
            email=email,
            mot_de_passe=mot_de_passe,
            activite=activite,
            telephone=telephone
        )

        return Response({
            'token': f"token-user-{user.id}",
            'user': {
                'id': user.id,
                'username': user.nom_admin,
                'email': user.email,
                'nomEntreprise': user.nom_entreprise,
                'activite': user.activite,
                'telephone': user.telephone
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def login_view(request):
    identifier = request.data.get('email') or request.data.get('username')
    mot_de_passe = request.data.get('password')

    if not identifier or not mot_de_passe:
        return Response({'error': "Veuillez remplir tous les champs."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Recherche par email ou nom_admin
        user = Utilisateur.objects.filter(email=identifier).first() or Utilisateur.objects.filter(nom_admin=identifier).first()

        if user and user.mot_de_passe == mot_de_passe:
            return Response({
                'token': f"token-user-{user.id}",
                'user': {
                    'id': user.id,
                    'username': user.nom_admin,
                    'email': user.email,
                    'nomEntreprise': user.nom_entreprise,
                    'activite': user.activite,
                    'telephone': user.telephone
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': "Identifiants ou mot de passe incorrect."}, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
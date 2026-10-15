from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClientViewSet, ServiceViewSet, DevisViewSet, 
    LigneDevisViewSet, FactureViewSet, PaiementViewSet,
    register_view, login_view, profile_view,
    verify_email_view, resend_code_view, forgot_password_view, reset_password_view
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'devis', DevisViewSet, basename='devis')
router.register(r'lignes-devis', LigneDevisViewSet, basename='lignedevis')
router.register(r'factures', FactureViewSet, basename='facture')
router.register(r'paiements', PaiementViewSet, basename='paiement')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_view, name='api_register'),
    path('login/', login_view, name='api_login'),
    path('verify-email/', verify_email_view, name='api_verify_email'),
    path('resend-code/', resend_code_view, name='api_resend_code'),
    path('forgot-password/', forgot_password_view, name='api_forgot_password'),
    path('reset-password/', reset_password_view, name='api_reset_password'),
    path('profile/', profile_view, name='api_profile'),
]
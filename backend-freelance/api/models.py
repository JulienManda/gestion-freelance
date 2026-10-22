from django.db import models

class Utilisateur(models.Model):
    nom_entreprise = models.CharField(max_length=255, default="MonEspace")
    nom_admin = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    mot_de_passe = models.CharField(max_length=255)
    activite = models.CharField(max_length=255, blank=True, null=True, default="Community Management & Design")
    telephone = models.CharField(max_length=20, blank=True, null=True)
    # True par défaut : les comptes déjà existants restent utilisables.
    # L'inscription crée le compte avec False jusqu'à la saisie du code.
    email_verifie = models.BooleanField(default=True)

    # Attendus par Django REST Framework pour un modèle d'utilisateur personnalisé
    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __str__(self):
        return f"{self.nom_entreprise} - {self.nom_admin}"

class Client(models.Model):
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='clients', null=True, blank=True)
    nom = models.CharField(max_length=255)
    entreprise = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField()  # unicité vérifiée par utilisateur dans le serializer
    telephone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.nom

class Service(models.Model):
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='services', null=True, blank=True)
    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    prix_base = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.nom

class Devis(models.Model):
    STATUT_CHOICES = [
        ('ATTENTE', 'En attente'),
        ('ACCEPTE', 'Accepté'),
        ('REFUSE', 'Refusé'),
    ]
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='devis', null=True, blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='devis')
    date_creation = models.DateField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='ATTENTE')

    def __str__(self):
        return f"Devis #{self.id} - {self.client.nom}"

class LigneDevis(models.Model):
    devis = models.ForeignKey(Devis, on_delete=models.CASCADE, related_name='lignes')
    service = models.ForeignKey(Service, on_delete=models.RESTRICT)
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantite}x {self.service.nom}"

class Facture(models.Model):
    devis = models.OneToOneField(Devis, on_delete=models.RESTRICT, related_name='facture')
    date_emission = models.DateField(auto_now_add=True)
    date_echeance = models.DateField()

    def __str__(self):
        return f"Facture #{self.id} - {self.devis.client.nom}"

class Paiement(models.Model):
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='paiements')
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date_paiement = models.DateField(auto_now_add=True)
    moyen = models.CharField(max_length=50)

    def __str__(self):
        return f"Paiement {self.montant} - Facture #{self.facture.id}"

class CodeVerification(models.Model):
    """Code à 6 chiffres envoyé par email (confirmation d'inscription ou mot de passe oublié).
    Le code n'est jamais stocké en clair : seulement son empreinte (HMAC)."""
    PURPOSE_CHOICES = [
        ('VERIFY', 'Confirmation email'),
        ('RESET', 'Réinitialisation mot de passe'),
    ]
    email = models.EmailField()
    purpose = models.CharField(max_length=10, choices=PURPOSE_CHOICES)
    code_hash = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('email', 'purpose')

    def __str__(self):
        return f"{self.purpose} - {self.email}"

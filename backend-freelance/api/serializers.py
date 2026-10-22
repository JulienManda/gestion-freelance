from rest_framework import serializers
from .models import Client, Service, Devis, LigneDevis, Facture, Paiement

INTROUVABLE = 'Élément introuvable.'


def current_user(serializer):
    request = serializer.context.get('request')
    return getattr(request, 'user', None)


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        exclude = ['utilisateur']

    def validate_email(self, value):
        qs = Client.objects.filter(utilisateur=current_user(self), email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Un client avec cet email existe déjà.')
        return value


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        exclude = ['utilisateur']


class LigneDevisSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneDevis
        fields = '__all__'
        extra_kwargs = {'devis': {'required': False}}  # Indispensable pour les écritures imbriquées

    def validate_service(self, value):
        if value.utilisateur_id != current_user(self).id:
            raise serializers.ValidationError(INTROUVABLE)
        return value

    def validate_devis(self, value):
        if value.utilisateur_id != current_user(self).id:
            raise serializers.ValidationError(INTROUVABLE)
        return value


class DevisSerializer(serializers.ModelSerializer):
    lignes = LigneDevisSerializer(many=True, required=False)

    class Meta:
        model = Devis
        fields = ['id', 'client', 'statut', 'date_creation', 'lignes']
        read_only_fields = ['date_creation']  # Évite les conflits avec auto_now_add=True

    def validate_client(self, value):
        if value.utilisateur_id != current_user(self).id:
            raise serializers.ValidationError(INTROUVABLE)
        return value

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        devis = Devis.objects.create(**validated_data)  # contient « utilisateur » (ajouté par la vue)
        for ligne_data in lignes_data:
            LigneDevis.objects.create(devis=devis, **ligne_data)
        return devis

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lignes_data is not None:
            instance.lignes.all().delete()
            for ligne_data in lignes_data:
                LigneDevis.objects.create(devis=instance, **ligne_data)

        return instance


class FactureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facture
        fields = '__all__'

    def validate_devis(self, value):
        if value.utilisateur_id != current_user(self).id:
            raise serializers.ValidationError(INTROUVABLE)
        return value


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = '__all__'

    def validate_facture(self, value):
        if value.devis.utilisateur_id != current_user(self).id:
            raise serializers.ValidationError(INTROUVABLE)
        return value

from rest_framework import serializers
from .models import Client, Service, Devis, LigneDevis, Facture, Paiement

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class LigneDevisSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneDevis
        fields = '__all__'
        extra_kwargs = {'devis': {'required': False}} # Indispensable pour les écritures imbriquées

class DevisSerializer(serializers.ModelSerializer):
    lignes = LigneDevisSerializer(many=True, required=False)

    class Meta:
        model = Devis
        fields = ['id', 'client', 'statut', 'date_creation', 'lignes']
        read_only_fields = ['date_creation'] # Évite les conflits avec auto_now_add=True

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        devis = Devis.objects.create(**validated_data)
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

class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = '__all__'
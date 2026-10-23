from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=255)),
                ('entreprise', models.CharField(blank=True, max_length=255, null=True)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('telephone', models.CharField(blank=True, max_length=20, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Devis',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_creation', models.DateField(auto_now_add=True)),
                ('statut', models.CharField(choices=[('ATTENTE', 'En attente'), ('ACCEPTE', 'Accepté'), ('REFUSE', 'Refusé')], default='ATTENTE', max_length=20)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='devis', to='api.client')),
            ],
        ),
        migrations.CreateModel(
            name='Facture',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_emission', models.DateField(auto_now_add=True)),
                ('date_echeance', models.DateField()),
                ('devis', models.OneToOneField(on_delete=django.db.models.deletion.RESTRICT, related_name='facture', to='api.devis')),
            ],
        ),
        migrations.CreateModel(
            name='Service',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('prix_base', models.DecimalField(decimal_places=2, max_digits=10)),
            ],
        ),
        migrations.CreateModel(
            name='Paiement',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('montant', models.DecimalField(decimal_places=2, max_digits=10)),
                ('date_paiement', models.DateField(auto_now_add=True)),
                ('moyen', models.CharField(max_length=50)),
                ('facture', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='paiements', to='api.facture')),
            ],
        ),
        migrations.CreateModel(
            name='LigneDevis',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantite', models.PositiveIntegerField(default=1)),
                ('prix_unitaire', models.DecimalField(decimal_places=2, max_digits=10)),
                ('devis', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lignes', to='api.devis')),
                ('service', models.ForeignKey(on_delete=django.db.models.deletion.RESTRICT, to='api.service')),
            ],
        ),
    ]

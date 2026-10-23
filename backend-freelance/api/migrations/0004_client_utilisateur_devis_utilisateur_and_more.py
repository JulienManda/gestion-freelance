from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_utilisateur_email_verifie_alter_client_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='utilisateur',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='clients', to='api.utilisateur'),
        ),
        migrations.AddField(
            model_name='devis',
            name='utilisateur',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='devis', to='api.utilisateur'),
        ),
        migrations.AddField(
            model_name='service',
            name='utilisateur',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='services', to='api.utilisateur'),
        ),
        migrations.AlterField(
            model_name='client',
            name='email',
            field=models.EmailField(max_length=254),
        ),
    ]

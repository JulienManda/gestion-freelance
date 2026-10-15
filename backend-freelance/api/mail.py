import json
import logging
import os
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)


class MailError(Exception):
    pass


def send_mail(to_email, subject, html, text):
    """Envoie un email via l'API HTTP de Brevo (Render gratuit bloque le SMTP).

    Variables d'environnement : BREVO_API_KEY, MAIL_FROM (expéditeur validé chez Brevo),
    MAIL_FROM_NAME (facultatif). Sans BREVO_API_KEY (développement local), le message
    est simplement affiché dans le terminal.
    """
    api_key = os.environ.get('BREVO_API_KEY')
    if not api_key:
        print(f"\n=== EMAIL (mode développement) ===\nÀ : {to_email}\nSujet : {subject}\n{text}\n==================================\n")
        return

    sender = os.environ.get('MAIL_FROM')
    if not sender:
        raise MailError('MAIL_FROM non configuré.')

    body = json.dumps({
        'sender': {'name': os.environ.get('MAIL_FROM_NAME', 'MonEspace'), 'email': sender},
        'to': [{'email': to_email}],
        'subject': subject,
        'htmlContent': html,
        'textContent': text,
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://api.brevo.com/v3/smtp/email',
        data=body,
        headers={'api-key': api_key, 'content-type': 'application/json', 'accept': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=10):
            return
    except urllib.error.HTTPError as e:
        logger.error('Brevo HTTP %s : %s', e.code, e.read()[:300])
        raise MailError('Envoi refusé par le fournisseur email.')
    except Exception as e:  # réseau, timeout...
        logger.error('Envoi email impossible : %s', e)
        raise MailError('Envoi email impossible.')

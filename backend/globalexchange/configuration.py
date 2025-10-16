import os
from dotenv import load_dotenv

load_dotenv()

class Configs:
    POSTGRES_DB = os.getenv('POSTGRES_DB')
    POSTGRES_USER = os.getenv('POSTGRES_USER')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')
    POSTGRES_HOST = os.getenv('POSTGRES_HOST')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT')
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
    DJANGO_DEBUG = os.getenv('DJANGO_DEBUG').lower() == 'true' # type: ignore
    HOST_ALLOW_ORIGINS = os.getenv('HOST_ALLOW_ORIGINS')
    SECRET_KEY = os.getenv('SECRET_KEY')
    STRIPE_KEY = os.getenv('STRIPE_KEY')
    DEV_URL = os.getenv('DEV_URL')
    PROD_URL = os.getenv('PROD_URL')
    STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET') if DJANGO_DEBUG else os.getenv('STRIPE_WEBHOOK_SECRET_DEPLOY')

config = Configs()

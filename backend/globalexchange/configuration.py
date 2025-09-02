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
    DJANGO_DEBUG = os.getenv('DJANGO_DEBUG')
    HOST_ALLOW_ORIGINS = os.getenv('HOST_ALLOW_ORIGINS')


config = Configs()

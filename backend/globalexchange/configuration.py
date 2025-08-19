import os
from dotenv import load_dotenv

load_dotenv()

class Configs:
    DATABASE_NAME = os.getenv('DATABASE_NAME')
    DATABASE_USER = os.getenv('DATABASE_USER')
    DATABASE_PASS = os.getenv('DATABASE_PASS')
    DATABASE_HOST = os.getenv('DATABASE_HOST')
    DATABASE_PORT = os.getenv('DATABASE_PORT')


config = Configs()

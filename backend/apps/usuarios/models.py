import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
   
    def __str__(self):
        return self.username

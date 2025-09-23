from rest_framework import serializers
from django.contrib.auth.models import Permission
import re

class PermissionMiniSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source="content_type.app_label", read_only=True)
    name_es = serializers.SerializerMethodField()

    ACTION_ES = {
        'add': 'Crear',
        'change': 'modificar',
        'delete': 'eliminar',
        'view': 'ver',
    }

    class Meta:
        model = Permission
        fields = ["id", "codename", "name", "name_es", "app_label"]

    def _postprocess_name_es(self, s: str) -> str:
        if not s:
            return s

        # Reemplazo específico pedido: 'group' -> 'roles' (ignora mayúsculas/minúsculas)
        def _repl_group(m):
            # Si querés respetar mayúscula inicial cuando aparezca "Group":
            return 'Roles' if m.group(0)[0].isupper() else 'roles'

        s = re.sub(r'\bgroup(s)?\b', _repl_group, s, flags=re.IGNORECASE)
        s = re.sub(r'\btasa\b', 'cotización', s, flags=re.IGNORECASE) 
        return s

    def get_name_es(self, obj: Permission) -> str:
        # 1) Intentar traducir desde 'name' (e.g. "Can change group")
        m = re.match(r'^\s*Can\s+(add|change|delete|view)\s+(.+)$', obj.name or '', flags=re.IGNORECASE)
        if m:
            verbo = self.ACTION_ES.get(m.group(1).lower(), m.group(1).lower())
            objeto = m.group(2).strip().replace('_', ' ')
            return self._postprocess_name_es(f"Puede {verbo} {objeto}")

        # 2) Fallback: usar 'codename' (e.g. "change_group")
        m2 = re.match(r'^\s*(add|change|delete|view)_(.+)$', obj.codename or '', flags=re.IGNORECASE)
        if m2:
            verbo = self.ACTION_ES.get(m2.group(1).lower(), m2.group(1).lower())
            model_cls = obj.content_type.model_class() if obj.content_type else None
            if model_cls is not None:
                objeto = str(model_cls._meta.verbose_name)
            else:
                objeto = m2.group(2).replace('_', ' ')
            return self._postprocess_name_es(f"Puede {verbo} {objeto}")

        # 3) Permisos custom: devolver 'name' tal cual (ya lo ponés en español)
        return self._postprocess_name_es(obj.name or "")

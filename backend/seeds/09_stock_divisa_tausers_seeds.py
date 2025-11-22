from collections import defaultdict

from apps.divisas.models import Denominacion
from apps.stock.models import StockDivisaTauser
from apps.tauser.models import Tauser


def _calculate_stock(position: int, total: int) -> int:
    """
    Return a generous stock value that favours the lowest and highest
    denominations so Tausers are well supplied for extreme cash demands.
    """
    base_stock = 2000

    if total <= 2:
        return base_stock * 4

    if position == 0 or position == total - 1:
        return base_stock * 5  
    
    if position == 1 or position == total - 2:
        return base_stock * 3

    return base_stock * 2


def run():
    print(">> Seeding Tauser stock by denomination...")

    tausers = list(Tauser.objects.filter(is_active=True))
    if not tausers:
        print("!! No Tausers available; skipping stock seed.")
        return

    denominaciones_by_currency = defaultdict(list)
    for denominacion in Denominacion.objects.filter(is_active=True).select_related("divisa"):
        denominaciones_by_currency[denominacion.divisa.codigo].append(denominacion)

    if not denominaciones_by_currency:
        print("!! No active denominations found; nothing to seed.")
        return

    total_created = 0
    total_updated = 0

    for currency_code, denominaciones in denominaciones_by_currency.items():
        denominaciones.sort(key=lambda d: d.denominacion)

        print(f">> Processing currency {currency_code} with {len(denominaciones)} denominations.")

        for tauser in tausers:
            for idx, denominacion in enumerate(denominaciones):
                stock_value = _calculate_stock(idx, len(denominaciones))

                stock, created = StockDivisaTauser.objects.update_or_create(
                    tauser=tauser,
                    denominacion=denominacion,
                    defaults={"stock": stock_value},
                )

                if created:
                    total_created += 1
                else:
                    total_updated += 1

            print(f"   - Stock seeded for Tauser {tauser.codigo} in {currency_code}.")

    print(f">> Stock entries created: {total_created}, updated: {total_updated}.")
    print(">> Tauser denomination stock seeding completed.")


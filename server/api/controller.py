from datetime import date
class HomeDashController:

    def row_to_transaction(self, row: dict) -> dict:
        return {
            "id": row["id"],
            "date": row["date"],
            "type": row["type"],
            "amount": float(row["amount"]),
            "description": row["description"],
        }


    def row_to_cart(self, row: dict) -> dict:
        return {
            "id": row["id"],
            "itemName": row["item_name"],
            "store": row["store"],
            "cost": float(row["cost"]),
            "notes": row["notes"],
        }


    def current_month_range(self):
        today = date.today()
        start = date(today.year, today.month, 1)
        if today.month == 12:
            next_month = date(today.year + 1, 1, 1)
        else:
            next_month = date(today.year, today.month + 1, 1)
        return start.isoformat(), next_month.isoformat()

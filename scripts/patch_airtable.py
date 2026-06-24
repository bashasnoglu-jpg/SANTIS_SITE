
import os
import sys

filepath = "app/services/airtable_db.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace(
    "def update_record(self, table_name: str, record_id: str, fields: dict) -> dict:",
    "def update_record(self, table_name: str, record_id: str, fields: dict, **kwargs) -> dict:"
)

code = code.replace(
    "body = {\"fields\": fields}",
    "body = {\"fields\": fields}\n        body.update(kwargs)"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)
print("Patched airtable_db.py")


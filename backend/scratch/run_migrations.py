import sys
import os

# Ensure backend root is on the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import migrate_db
print("Running migrate_db()...")
migrate_db()
print("migrate_db() finished.")

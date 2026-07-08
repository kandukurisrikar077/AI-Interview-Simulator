import sys, os, traceback
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.main import migrate_db
print('Running migrations...')
try:
    migrate_db()
    print('Migrations completed successfully.')
except Exception as e:
    print('Migration error:', e)
    traceback.print_exc()

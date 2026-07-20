from database import interactions_collection
from datetime import datetime

res = interactions_collection.update_many(
    {}, 
    {'$set': {'timestamp': datetime.now().astimezone().isoformat()}}
)
print(f'Updated {res.modified_count} interactions')

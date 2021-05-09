import time
from redis_json import RedisJson
from redis_search import RediSearch, NumericFilter, GeoFilter
from flask import Flask, request, jsonify
from flask_cors import CORS

'''
    Flask server to interface with Redis APIs
'''

## Globals

index = 'resource_map'
numeric_fields = [
    'masks',
    'vaccines',
    'oxygen',
    'updated', # last updated unix time in seconds
]

geo_fields = [
    'coords',
]

# Not really int max, but hopefully numbers don't exceed this for our purposes
# (I think this is 10 billion)
INT_MAX = 10000000000

app = Flask(__name__)
CORS(app)
redisJson = RedisJson()
rediSearch = RediSearch(index, numeric_fields, geo_fields)

## Code

'''
Given long + lat, construct key to store data at
'''
def construct_key(lat, long):
    return str(long) + "," + str(lat)

'''
Endpoint to insert JSON data

@requires 'lat' and 'long' keys to exist in the data
'''
@app.route('/insert', methods=['POST'])
def insert_data():
    json = request.json
    if 'lat' in json and 'long' in json:
        key = construct_key(json['lat'], json['long'])

        rediSearch.insert_doc(
            key,
            masks=json['masks'],
            vaccines=json['vaccines'],
            oxygen=json['oxygen'],
            updated=time.time(),
            coords=key
        )

        return jsonify({'lat': json['lat'], 'long': json['long']}), 200

    return "Bad request", 400



'''
Endpoint to retrieve existing data by filter

@requires 'lat' and 'long' and 'radius' keys to exist in the data

Note: Can only filter by 1 numeric quantity (RediSearch restriction)
'''
@app.route('/get', methods=['POST'])
def get_data():
    json = request.json
    if 'lat' in json and 'long' in json:
        key = construct_key(json['lat'], json['long'])

        radius = json['radius']

        geo_filter = GeoFilter('coords', json['long'], json['lat'], radius, unit='km')

        # Note: sort of hard coding this "must be >= 1" check, but if we feel
        # that we need more flexible queries we can look into making this more
        # customizable later
        numeric_filter = NumericFilter(json['numeric'], 1, INT_MAX) if 'numeric' in json else None
        results = rediSearch.get(numeric_filter=numeric_filter, geo_filter=geo_filter)
        print(results)

        # This looks like a bottleneck at scale, but we probably don't have to
        # worry about this for now
        response = []
        for doc in results:
            # "long,lat"
            longlat = doc.coords.split(',')
            response.append({
                'lat'  : longlat[1],
                'long' : longlat[0],
                'masks': doc.masks,
                'vaccines': doc.vaccines,
                'oxygen'  : doc.oxygen,
                'updated' : doc.updated,
            })
        return {'results' : response}, 200
    
    return "Bad request", 400

if __name__ == "__main__":
    app.run()
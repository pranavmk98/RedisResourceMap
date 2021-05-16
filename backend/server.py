import time
import redis
import json

from redis_json import RedisJson
from redis_search import RediSearch, NumericFilter, GeoFilter
from redis_gears import create_gears_jobs
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit

'''
Flask server to interface with Redis APIs
'''

#############
## Globals ##
#############

# RediSearch index name
INDEX = 'resource_map'

# Numeric fields in RediSearch
NUMERIC_FIELDS = [
    'masks',
    'vaccines',
    'oxygen',
    'updated', # last updated unix time in seconds
]

# Geospatial fields in RediSearch
GEO_FIELDS = [
    'coords',
]

# Socket namespace to publish updates on
SOCKET_NAMESPACE = ''

# Not really int max, but hopefully numbers don't exceed this for our purposes
# (I think this is 10 billion)
INT_MAX = 10000000000

app = Flask(__name__)
CORS(app)
# TODO: install eventlet if this is too slow
socket_app = SocketIO(app, cors_allowed_origins='*')
redisJson = RedisJson()
rediSearch = RediSearch(INDEX, NUMERIC_FIELDS, GEO_FIELDS)
redisClient = redis.Redis(host='localhost', port=6379)

################
## Helper fns ##
################

'''
Given long + lat, construct key to store data at
'''
def get_key(lat, long):
    return f'{long},{lat}'

'''
Given long + lat + radius, construct name of socket namespace
'''
def get_socket_namespace(lat, long, radius):
    return f'{abs(long)}_{abs(lat)}_{radius}'



######################
## Server endpoints ##
######################

'''
Endpoint to insert JSON data

@requires 'lat' and 'long' keys to exist in the data

Example of expected POST data:
{
    'lat': 10.573,
    'long': -48.62,
    'masks': 500,
    'vaccines': 345,
    'oxygen': 23
}
'''
@app.route('/insert', methods=['POST'])
def insert_data():
    json = request.json
    if 'lat' in json and 'long' in json:
        key = get_key(json['lat'], json['long'])

        rediSearch.insert_doc(
            key,
            masks=(0 if 'masks' not in json else json['masks']),
            vaccines=(0 if 'vaccines' not in json else json['vaccines']),
            oxygen=(0 if 'oxygen' not in json else json['oxygen']),
            updated=time.time(),
            coords=key
        )

        return jsonify({'lat': json['lat'], 'long': json['long']}), 200

    return "Bad request", 400



'''
Endpoint to retrieve existing data by filter

@requires 'lat' and 'long' and 'radius' keys to exist in the data

Note: Can only filter by 1 numeric quantity (RediSearch restriction)

Example of expected POST data:
{
    'lat': 10.573,
    'long': -48.62,
    'radius': 25, (in kilometers)
    'numeric': 'masks' [optional arg]
}

Return JSON data format:
{
    'results' : [
        {
            'lat': 10.573,
            'long': -48.62,
            'masks': 500,
            'vaccines': 345,
            'oxygen': 23,
            'updated': 18727939423
        },
        ...
    ],
    'namespace' : 'socket_namespace_1'
}
'''
@app.route('/get', methods=['POST'])
def get_data():
    json = request.json
    if 'lat' in json and 'long' in json:
        lat, long, radius = json['lat'], json['long'], json['radius']

        key = get_key(lat, long)
        geo_filter = GeoFilter('coords', long, lat, radius, unit='km')

        # Note: sort of hard coding this "must be >= 1" check, but if we feel
        # that we need more flexible queries we can look into making this more
        # customizable later
        numeric_filter = NumericFilter(json['numeric'], 1, INT_MAX) if 'numeric' in json else None
        results = rediSearch.get(numeric_filter=numeric_filter, geo_filter=geo_filter)

        # This looks like a bottleneck at scale, but we probably don't have to
        # worry about this for now
        response = []
        for doc in results:
            longlat = doc.coords.split(',') # "long,lat"
            response.append({
                'lat'  : longlat[1],
                'long' : longlat[0],
                'masks': doc.masks,
                'vaccines': doc.vaccines,
                'oxygen'  : doc.oxygen,
                'updated' : doc.updated,
            })

        # SOCKET_NAMESPACE = get_socket_namespace(lat, long, radius)

        create_gears_jobs(lat, long, radius)
        return {'results' : response, 'namespace' : SOCKET_NAMESPACE}, 200

    return "Bad request", 400

'''
Process message received from Redis PubSub channels and push it onto websocket

Format of new data: {
    'masks': 20,
    'vaccines': 30,
    'oxygen': 40,
    'updated': 16979930.9901
    'coords': '-10.0,15.0' (long,lat)
}

Format of match data (e.g. for masks): {
    'masks_match': 1,
    'qty': 40,
    'need_lat': 15.0,
    'need_long': -10.0,
    'has_lat': 15.2,
    'has_long': -10.1,
    'distance': 450 (in km)
}
'''
def process_channel_msg(msg):
    if msg['type'] == 'message':
        with app.test_request_context():
            # print(msg['data'])
            data = msg['data'].decode('utf-8')
            json_data = json.dumps(data)
            # print(json_data)
            socket_app.emit('message', data, namespace=SOCKET_NAMESPACE)

if __name__ == "__main__":
    pubsub = redisClient.pubsub()
    pubsub.subscribe(**{'new_data': process_channel_msg, 'match_data': process_channel_msg})
    pubsub.run_in_thread(sleep_time=0.1)
    socket_app.run(app)
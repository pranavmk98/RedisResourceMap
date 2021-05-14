from gearsclient import GearsRemoteBuilder as GB
from gearsclient import execute, log

INDEX = 'resource_map'
INT_MAX = 10000000000

'''
Register RedisGears jobs
'''
def create_gears_jobs(lat, long, radius):
    # Function to execute on each added key
    def publish_new_data(x):
        # Use geospatial querying from RediSearch
        args = [INDEX, f'@coords:[{long} {lat} {radius} km]', 'INKEYS', 1, x['key']]
        results = execute('FT.SEARCH', *args)
        if str(results) == "0":
            return

        # Nasty, lots of hardcoding, assumes result format:
        result = results[2]
        if len(result) % 2 != 0:
            return

        # Publish update on pubsub channel
        output_dict = {result[i] : result[i + 1] for i in range(0, len(result), 2)}
        execute('PUBLISH', 'new_data', str(output_dict))

    # Function to match up required resources with existing ones
    def get_match_resource(resource):
        def match_resource(x):
            import ast
            new_data = ast.literal_eval(str(x['value']))

            long, lat = new_data['coords'].split(',')

            if int(new_data[resource]) >= 0:
                return
            required = abs(int(new_data[resource]))

            # Use geospatial querying from RediSearch to find closest
            # matching location
            results = None
            log(str(resource) + "," + str(required) + "," + str(radius))
            for radi_iter in range(1, radius + 1):
                args = [
                    INDEX,
                    f'@coords:[{long} {lat} {radi_iter} km]',
                    'FILTER', resource, required, INT_MAX,
                    'LIMIT', 0, 1
                ]

                results = execute('FT.SEARCH', *args)
                if str(results) != "[0]":
                    break

            # If no available locations, return
            if not results:
                return

            results_py = ast.literal_eval(str(results))
            first_result = results_py[2]

            data_dict = {first_result[i] : first_result[i + 1] for i in range(0, len(first_result), 2)}
            data_dict[resource + '_match'] = 1
            has_long, has_lat = data_dict['coords'].split(',')

            output_data = {}
            output_data[resource + '_match'] = 1
            output_data['qty'] = required
            output_data['need_lat'] = lat
            output_data['need_long'] = long
            output_data['has_lat'] = has_lat
            output_data['has_long'] = has_long
            output_data['distance'] = radi_iter

            execute('PUBLISH', 'match_data', str(output_data))

        return match_resource


    redisGears = GB('KeysReader').foreach(publish_new_data).register(prefix='*', eventTypes=['hset', 'hmset'])
    redisGears = GB('KeysReader').foreach(get_match_resource('masks')).register(prefix='*', eventTypes=['hset', 'hmset'])
    redisGears = GB('KeysReader').foreach(get_match_resource('vaccines')).register(prefix='*', eventTypes=['hset', 'hmset'])
    redisGears = GB('KeysReader').foreach(get_match_resource('oxygen')).register(prefix='*', eventTypes=['hset', 'hmset'])

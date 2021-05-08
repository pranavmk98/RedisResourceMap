from rejson import Client, Path

class RedisJson:
    def __init__(self):
        self._rjson = Client(host='localhost', port=6379, decode_responses=True)
        self._root_path = Path.rootPath()

    '''
        Insert JSON into db

        Structure of JSON to insert:
        {
            'lat'  : 80.844,
            'long' : -43.139,
            'resources' : {
                'mask' : 450,
                'vaccine' : 56,
                'oxygen' : 800,
                ...
            },
            'updated' : <unix time ms>
        }
    '''
    def insert(self, key, data):
        self._rjson.jsonset(key, self._root_path, data)
    
    '''
        Return list of all JSON objects stored in db

        TODO: added this for now, but loading everything in memory doesn't seem
        like a great idea, maybe RedisSearch will help with this. Or maybe make
        this return a generator which can be iterated through
    '''
    def get(self):
        results = []
        for key in self._rjson.scan_iter():
            results.append(self._rjson.jsonget(key, self._root_path))
        
        return results
    
    '''
        Update field of a JSON object in db

        Syntax for `path` argument:
        E.g. we have {
            'key1' : value1,
            'key2' : {
                'key3' : value2
            }
        }

        To update value2, `path` should be ".key2.key3"
    '''
    def update(self, key, path, new_value):
        self._rjson.jsonset(key, path, new_value)
    
    '''
        Delete a JSON value from the db
    '''
    def delete(self, key):
        self._rjson.jsondel(key, self._root_path)

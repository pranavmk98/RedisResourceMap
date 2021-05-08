from redisearch import *

class RediSearch:
    '''
        Create a RediSearch index using the given index, numeric fields, and geo
        fields.
    '''
    def __init__(self, index, numeric_fields, geo_fields):
        self._rsearch = Client(index)
        fields = [GeoField(geo) for geo in geo_fields] + [NumericField(num) for num in numeric_fields]
        self._rsearch.create_index(fields)
        

    '''
        Insert document to be indexed
        Note: kwargs passed in must have been present on RediSearch() creation
    '''
    def insert_doc(self, key, **kwargs):
        self._rsearch.add_document(key, **kwargs)
    
    '''
        Return list of all documents, filtered by numeric_filter and geo_filter (if passed in)
    '''
    def get(self, query_string='*', numeric_filter=None, geo_filter=None):
        query = Query(query_string)
        if numeric_filter:
            query = query.add_filter(numeric_filter)
        if geo_filter:
            query = query.add_filter(geo_filter)
        result = self._rsearch.search(query)
        return result.docs
    
    '''
        Update a document and reindex it
    '''
    def update(self,  key, **kwargs):
        self._rsearch.add_document(key, replace=True, **kwargs)
    
    '''
        Delete a document
    '''
    def delete(self, key):
        self._rsearch.delete_document(key)

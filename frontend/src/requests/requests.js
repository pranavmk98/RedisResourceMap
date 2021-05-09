

function httpRequest(params, postData) {
    return new Promise(function(resolve, reject) {
        var req = http.request(params, function(res) {
            // on bad status, reject
            // on response data, cumulate it
            // on end, parse and resolve
        });
        // on request error, reject
        // if there's post data, write it to the request
        // important: end the request req.end()
    });
}

function createLocation(data) {
    fetch("/path/to/createData")
        .then(res => res.json())
}

function readLocation() {

}

function updateLocation(locationId, data) {

}

function deleteLocation(locationId) {

}
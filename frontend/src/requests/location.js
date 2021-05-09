
function getUserLocation() {
    return new Promise((onSuccess, onError) =>
        navigator.geolocation.getCurrentPosition(onSuccess, onError)
    );
}
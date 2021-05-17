# RedisResourceMap

COVID-19 Resource Dashboard is a project leveraging the power of RediSearch, RedisGears, and Redis PubSub to create a live-updating, crowdsourced dashboard to connect places with excess supply of masks, oxygen, and vaccines to places lacking in such supplies. Users can add locations to indicate both excess supply and required resources, and the RedisGears matching engine will utilize the power of RediSearch geospatial querying to match up supplies with requirements.

## How data is stored

- Resource and location data are stored as documents in the RediSearch format. They contain the fields:
  - masks (Numerical)
  - vaccines (Numerical)
  - oxygen (Numerical)
  - updated (Numerical)
  - coords (Geo)
- Data is queried with the RediSearch API, specifically using `FT.SEARCH` with heavy use of `GEORADIUS`. This is used to query within a certain radius near a location.
- New data is processed with RedisGears async jobs, and sent via Redis PubSub on either the `new_data` channel or `match_data` channel (if a resource is matched)

## Screenshots

![Main Page](https://raw.githubusercontent.com/pranavmk98/RedisResourceMap/master/img/MainPage.jpg)
![Match graph](https://raw.githubusercontent.com/pranavmk98/RedisResourceMap/master/img/Graph.jpg)

## Instructions

- Run the Redis labs RedisModules docker image: `docker run -p 6379:6379 redislabs/redismod`
- Using pip and python 3.7, install the requirements in `requirements.txt`, or create a Conda environment using `conda env create --file conda_env.yml` and then run `conda activate redis` to activate the environment.
- Run `python server.py` from `backend/`.  This will create a server accessible at `localhost:5000`
- Install node.js and npm if you do not already have it installed (see [https://nodejs.org/en/download/](https://nodejs.org/en/download/)).  Then run `npm install` and `npm start` from `frontend/`, and the React frontend should appear in your web browser at `localhost:3000/admin/dashboard`

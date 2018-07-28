/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.dbpromise()
      .then(function (db) {
        let tx = db.transaction('restaurants', 'readonly');
        return tx.objectStore('restaurants').getAll()
          .then(function (restaurants) {
            if (restaurants.length === 0) {
              fetch(DBHelper.DATABASE_URL)
                .then(function (response) {
                  return response.json();
                })
                .then(function (restaurants) {
                  DBHelper.storeRestaurants(restaurants);
                  callback(null, restaurants);
                })
                .catch(function(err){
                  callback(err, null);
                });
            } else {
              callback(null, restaurants);
            }
          })
          .catch(function(err){
            callback(err, null);
          });
      })
      .catch(function (err) {
        callback(err, null);
      });
  }

  static dbpromise() {
    return idb.open('restaureview', 1, function (upgradeDB) {
      upgradeDB.createObjectStore('restaurants', {
        keyPath: 'id'
      });
    });
  }

  /**
   * Database URL.
   * Change DBHelper to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * @description store Restaurants object into indexDB
   * @param restaurants array of restaurants
   */
  static storeRestaurants(restaurants) {
    DBHelper.dbpromise()
      .then(function (db) {
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        restaurants.forEach(function (restaurant) {
          store.put(restaurant);
        });
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  /**
   * @description store single Restaurant object into indexDB this logic it'possible only starting
   * directly from restaurant.html with a link that could be shared. If it's open from main it's impossible
   * that all the restaurants it's not just stored into indexDB
   * @param restaurant array of restaurants
   */
  static storeSingleRestaurant(restaurant) {
    DBHelper.dbpromise()
      .then(function (db) {
        const tx = db.transaction('restaurants', 'readwrite');
        tx.objectStore('restaurants').put(restaurant);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    DBHelper.dbpromise()
      .then(function (db) {
        let tx = db.transaction('restaurants', 'readonly');
        return tx.objectStore('restaurants').get(parseInt(id))
          .then(function (restaurant) {
            if (!restaurant) {
              fetch(DBHelper.DATABASE_URL + `/${id}`)
                .then(function (response) {
                  return response.json();
                })
                .then(function (restaurant) {
                  DBHelper.storeSingleRestaurant(restaurant);
                  callback(null, restaurant);
                })
                .catch(function(err){
                  callback(err, null);
                });
            } else {
              callback(null, restaurant);
            }
          })
          .catch(function(){
            callback(`Restaurant id:${id} does not exist`);
          });
      })
      .catch(function (err) {
        callback(err, null);
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * @description Restaurant page URL.
   * @returns string
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * @description Restaurant image URL.
   * @returns string
   */
  static imageUrlForRestaurant(restaurant) {
    /* no pricture Photo by Peter Wendt on Unsplash */
    if (restaurant.photograph) {
      return `/img/${restaurant.photograph}-800px.jpg`;
    } else {
      return ('/img/peter-wendt-123928-unsplash-800px');
    }
  }

  /**
   * @description Restaurnat srcset for responsive images of url
   * @returns string
   */
  static imageSrcsetForRestaurant(restaurant) {
    let srcset = '';
    /* no pricture Photo by Peter Wendt on Unsplash */
    let srcimg = '/img/';
    if (restaurant.photograph) {
      srcimg += restaurant.photograph;
    } else {
      srcimg += 'peter-wendt-123928-unsplash';
    }
    const srcOptions = [
      '-400px.jpg 400w,\n',
      '-600px.jpg 600w,\n',
      '-800px.jpg 800w\n'
    ];
    srcOptions.forEach(function (src) {
      srcset = srcset + srcimg + src;
    });
    return srcset;
  }

  /**
   * @description Restaurnt image alternative of url
   */
  static imageAltForRestaurant(restaurant) {
    return (`Image of ${restaurant.name} Restaurant`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
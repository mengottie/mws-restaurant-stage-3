/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change DBHelper to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * @description create local indexDB for get data offline
   */
  static dbpromise() {
    return idb.open('restaureview', 1, function (upgradeDB) {
      upgradeDB.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      const revObjStore = upgradeDB.createObjectStore('reviews', {
        keyPath: 'id'
      });
      console.log('after create objectstore reviews');
      revObjStore.createIndex(
        'restaurant_id', 'restaurant_id', {unique: false}
      );
      console.log('after create objectstore index restaurant_id');
    });
  }

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
              fetch(`${DBHelper.DATABASE_URL}/restaurants`)
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
   * @description store into indexDB the review for use offline
   * @param {*} reviews
   */
  static storeReviewsLocaly (reviews) {
    DBHelper.dbpromise()
      .then(function(db){
        const tx = db.transaction('reviews', 'readwrite');
        const revStore = tx.objectStore('reviews');
        reviews.forEach(function(review){
          revStore.put(review);
        });
      })
      .catch(function (err){
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
              fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
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
   * @description get reviews of a restaurant from network first and fallback from local indexDb
   *              because review of a restaurant could be change frequently
   * @param {*} id
   * @param {*} callback
   */
  static fetchReviwsByRestaurantId (idRest, callback) {
    fetch(DBHelper.urlGetReviewByRestaurantId(idRest))
      .then(function(response){
        return response.json();
      })
      .then(function(reviewsFromNetwork){
        DBHelper.storeReviewsLocaly(reviewsFromNetwork);
        callback(null, reviewsFromNetwork);
      })
      .catch(function(err){
        DBHelper.getAllReviewByRestId(idRest, callback);
      });
  }

  /**
   * @description return a promise with the result of retriving all reviews of a restaurant id from
   *  local IDB trough index 'restaurant_id' on object store 'reviews'
   * @param {*} restId
   */
  static getAllReviewByRestId(restId, callback){
    console.log('id rstaurant is: ', restId);
    DBHelper.dbpromise()
      .then(function(db){
        const tx = db.transaction('reviews','readonly');
        const indexIdRest = tx.objectStore('reviews').index('restaurant_id');
        return indexIdRest.getAll(parseInt(restId));
      })
      .then(function(reviewFromLocalIDB){
        if (!reviewFromLocalIDB) {
          callback('no review found', null);
        } else {
          callback(null, reviewFromLocalIDB);
        }
      })
      .catch(function(err){
        callback(err, null);
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine (cuisine, callback) {
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
  static fetchRestaurantByNeighborhood (neighborhood, callback) {
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
   * @description Restaurant review page URL.
   * @returns string
   */
  static urlForInsertNewReview(restId){
    return (`./reviews.html/?id=${restId}`);
  }

  /**
   * @description return uri of API for get reviews by restaurant id
   * @param {*} restId
   */
  static urlGetReviewByRestaurantId(restId){
    return (`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restId}`);
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
   * @description Restaurant srcset for responsive images of url
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

  /**
   * @description set a restaurant as a favorite using put endpoint
   * http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=bool
   * @param {*} restId
   * @param {*} favState
   */
  static setFavoriteState(restId, favState) {
    console.log('set favorite button click');
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${restId}/?is_favorite=${favState}`, {
      method: 'PUT'
    })
      .then(function(resp){
        DBHelper.dbpromise()
          .then(function(db){
            const tx = db.transaction('restaurants', 'readwrite');
            const objSt = tx.objectStore('restaurants');
            objSt.get(restId)
              .then(function(restLocIdb){
                restLocIdb.is_favorite = favState;
                objSt.put(restLocIdb);
              })
              .catch(function(err){
                console.log(`error on get local retaurant by id ${restId}`, err );
              });
          });
      })
      .catch(function(err){
        console.log(`error on set favorite state ${favState} to restaurant id ${restId}`, err);
      });
  }
}
var restaurants;
var neighborhoods;
var cuisines;
var map;
var markers = [];
var mapApiInitEnd = false;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  mapApiInitEnd = true;
  addMarkersToMap();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  self.restaurants = restaurants;
  // if markers doesnt exist yet don't remove them
  if (!self.markers) return;
  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  if (mapApiInitEnd) {
    addMarkersToMap();
  }
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = DBHelper.imageAltForRestaurant(restaurant);
  li.append(image);

  const divContainer = document.createElement('div');
  divContainer.classList.add('card-container');
  li.append(divContainer);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  divContainer.append(name);
  //  if restaurant object doesn't have the is_favorite the favorite toggle button is not created

  const favButton = document.createElement('button');
  favButton.innerHTML = '♥';
  toggleIsFavoriteClass(favButton, restaurant.is_favorite);
  favButton.onclick = function(){
    restaurant.is_favorite = !restaurant.is_favorite;
    DBHelper.setFavoriteState(restaurant.id, restaurant.is_favorite);
    toggleIsFavoriteClass(favButton, restaurant.is_favorite);
  };
  divContainer.append(favButton);


  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  divContainer.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  divContainer.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  divContainer.append(more);

  const addReview = document.createElement('a');
  addReview.innerHTML = 'Add Review';
  addReview.href = DBHelper.urlForInsertNewReview(restaurant);
  divContainer.append(addReview);
  return li;
};

/**
 * @description toggle the class style of an element between is-favorite and is-not-favorite css class
 * @param {*} elem
 * @param {*} isFavorite
 */
const toggleIsFavoriteClass = ( elem, isFavorite ) => {
  if ( isFavorite ) {
    elem.classList.remove('is-not-favorite');
    elem.classList.add('is-favorite');
    elem.setAttribute('aria-label', 'it is set as favorite');
    elem.setAttribute('aria-pressed', true);
  }else {
    elem.classList.remove('is-favorite');
    elem.classList.add('is-not-favorite');
    elem.setAttribute('aria-label', 'it is set as not favorite');
    elem.setAttribute('aria-pressed', false);
  }
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = () => {
  if (!restaurants) return;
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    if (marker){
      self.markers.push(marker);
      google.maps.event.addListener(marker, 'click', () => {
        window.location.href = marker.url;
      });
    }
  });
};
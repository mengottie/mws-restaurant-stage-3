var restaurants;
var neighborhoods;
var cuisines;
var map;
var markers = [];
var mapApiInitEnd = false;

window.addEventListener('online', (event) => {
  DBHelper.postOffLineReview();
});

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
  const mapstatic = document.getElementById('static-map');
  mapstatic.addEventListener('click', () => {
    activateMapInteractive();
  });
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
 * Optimize goggle map loading using static map image
 */
function activateMapInteractive(){
  const staticMap = document.getElementById("static-map");
  const mapInteractive = document.getElementById("map");
  if(staticMap.style.display == '') {
    document.getElementById("static-map").style.display = 'none';
    mapInteractive.style.display = 'block';
  }
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
 * @description in the process of create the dom element of reataurant list define a lazy load mechanism to improve loading performances
 */
lazyLoadImages = (restaurant, liElement) => {
  const image = document.createElement('img');
  image.alt = DBHelper.imageAltForRestaurant(restaurant);

  let observer;
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };
  if ('Intersection') {
    observer = new IntersectionObserver (handleIntersection, observerOptions);
    observer.observe(image);
  } else {
    console.log('Intersection Observer not supported');
    loadImage(iamge);
  }

  const loadImage = (image) => {
    image.className = 'restaurant-img';
    image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
  };

  function handleIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.intersectionRatio > 0) {
        loadImage(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }
  liElement.append(image);
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  lazyLoadImages(restaurant, li);
  const divContainer = document.createElement('div');
  divContainer.classList.add('card-container');
  li.append(divContainer);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  divContainer.append(name);
  //  if restaurant object doesn't have the is_favorite the favorite toggle button is not created

  const favButton = document.createElement('button');
  console.log(restaurant.is_favorite);
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
  more.href = DBHelper.urlForRestaurant(restaurant.id);
  divContainer.append(more);

  const addReview = document.createElement('a');
  addReview.innerHTML = 'Add Review';
  addReview.href = DBHelper.urlForInsertNewReview(restaurant.id);
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
    elem.innerHTML = '♥';
    elem.classList.remove('is-not-favorite');
    elem.classList.add('is-favorite');
    elem.setAttribute('aria-label', 'it is set as favorite');
    elem.setAttribute('aria-pressed', true);
  }else {
    elem.innerHTML = 'Mark as favorite';
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
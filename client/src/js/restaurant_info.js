var restaurant;
var map;
var markerCreated = false;
var reviews;

window.addEventListener('online', (event) => {
  DBHelper.postOffLineReview();
});
/**
 * load restaurant detail and reviews when the document it's loaded
 * instead the current delegation of the responsability at the initMap function
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
      return;
    }
    self.restaurant = restaurant;
    fetchReviewsFromURL((error, reviews) => {
      self.reviews = reviews;
      fillBreadcrumb();
      fillRestaurantHTML();
      if (self.map && !markerCreated) {
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        markerCreated = true;
      }
    });
  });
});

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

  if (self.restaurant && !markerCreated) {
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    markerCreated = true;
  }
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      if (error) {
        console.error(error);
        return;
      }
      self.restaurant = restaurant;
      callback(null, restaurant);
    });
  }
};

fetchReviewsFromURL = (callback) => {
  const id = getParameterByName('id');
  DBHelper.fetchReviwsByRestaurantId(id, (errorReview, fetchedReviews) => {
    if (errorReview) {
      console.error(errorReview);
    }
    self.reviews = fetchedReviews;
    callback(null, fetchedReviews);
  });
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = DBHelper.imageAltForRestaurant(restaurant);


  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  const addReview = document.createElement('a');
  addReview.innerHTML = 'Add Review';
  addReview.href = DBHelper.urlForInsertNewReview(restaurant.id);
  container.append(addReview);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const divTitle = document.createElement('div');
  divTitle.classList.add('reviews-header');
  li.appendChild(divTitle);

  const h4 = document.createElement('h4');
  h4.innerHTML = review.name;
  divTitle.appendChild(h4);

  const date = document.createElement('span');
  date.classList.add('reviews-title-detail');
  const reviewDate = new Date(review.createdAt);
  date.innerHTML = reviewDate.toDateString();
  divTitle.appendChild(date);

  const rating = document.createElement('span');
  rating.classList.add('reviews-rating');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
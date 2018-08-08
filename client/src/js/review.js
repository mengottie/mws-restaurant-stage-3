var restId;
var restaurant;
var reviews;
var linkRestaurantDetailPage;

/**
 * load restaurant detail and reviews when the document it's loaded
 * instead the current delegation of the responsability at the initMap function
 */
document.addEventListener('DOMContentLoaded', (event) => {
  self.restId = parseInt(getParameterByName('id'));
  self.linkRestaurantDetailPage = DBHelper.urlForRestaurant(self.restId);
  fetchRevRestaurantFromURL(self.restId, (error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
      return;
    }
    self.restaurant = restaurant;
    fetchRevReviewsFromURL(self.restId, (errorRev, reviews) => {
      self.reviews = reviews;
      fillRevBreadcrumb();
      fillRevRestaurantHTML();
      fillRevReviewsHTML();
    });
  });
});

window.addEventListener('online', (event) => {
  DBHelper.postOffLineReview();
});

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

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillRevBreadcrumb = (restaurant = self.restaurant) => {
  console.log('fillBreadcrumb called');
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const aLink = document.createElement('a');
  aLink.href = self.linkRestaurantDetailPage;
  aLink.innerHTML = restaurant.name;
  li.appendChild(aLink);
  breadcrumb.appendChild(li);
  const liCurrent = document.createElement('li');
  liCurrent.innerHTML = "Insert Review Form";
  breadcrumb.appendChild(liCurrent);
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRevRestaurantHTML = (restaurant = self.restaurant) => {
  const titleForm = document.getElementById('review-form-title');
  titleForm.href = self.linkRestaurantDetailPage;
  titleForm.innerHTML = `Restaurant Reviews: ${restaurant.name}`;
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillRevReviewsHTML = (reviews = self.reviews) => {
  console.log('fillReviewsHTML called');
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review, true));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, flagOnline) => {
  const li = document.createElement('li');
  const divTitle = document.createElement('div');
  divTitle.classList.add('reviews-header');
  li.appendChild(divTitle);
  if(!flagOnline){
    li.classList.add('review-offline');
  }
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
 * Get current restaurant from page URL.
 */
fetchRevRestaurantFromURL = (restaurantId, callback) => {
  console.log(`fetchRevRestaurantFromURL called value of restID: ${restaurantId}`);
  DBHelper.fetchRestaurantById(restaurantId, (error, restaurant) => {
    if (error) {
      console.error(error);
      return;
    }
    callback(null, restaurant);
  });
};

fetchRevReviewsFromURL = (restaurantId, callback) => {
  console.log('fetchRevReviewsFromURL called');
  DBHelper.fetchReviwsByRestaurantId(restaurantId, (errorReview, fetchedReviews) => {
    if (errorReview) {
      console.error(errorReview);
    }
    callback(null, fetchedReviews);
  });
};

addNewReview = () => {
  event.preventDefault();
  let author = document.getElementById('author-name').value;
  let reviewText = document.getElementById('review-text').value;
  let rating = document.querySelector('#select-rating option:checked').value;
  newReview = {
    restaurant_id: parseInt(self.restId),
    rating: parseInt(rating),
    name: author,
    comments: reviewText,
    createdAt: new Date()
  };
  DBHelper.saveNewReview(newReview, function(err, flagOnline){
    if (err ) {
      console.log(err);
      return;
    }
    addReviewHTML(newReview, flagOnline);
  });
  document.getElementById('insert-review').reset();
  // window.location(DBHelper.urlForRestaurant(self.restId));
};

/**
 * @description add the review to the dom if it was inserted offline the class 'review-offline' it's added to ul element
 */
addReviewHTML = (newReview, flagOnline) => {
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(newReview, flagOnline));
};
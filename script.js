'use strict';

const leaflet = L

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const clearAll = document.querySelector('.btn--clear-all')

//buttons
const deleteBtn = document.querySelectorAll('.btn--delete')
const editBtn = document.querySelectorAll('.btn--edit')

class Workout {
   date = new Date()
   id = (Date.now() + '').slice(-10)
   clicks = 0
   constructor(coords, distance, duration) {
      this.coords = coords
      this.distance = distance
      this.duration = duration
   }
   _setDescription() {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      this.description =
         `${this.type[0].toUpperCase() + this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
   }
   click() {
      this.clicks++
   }
}

class Running extends Workout {
   type = 'running'
   constructor(coords, distance, duration, cadence) {
      super(coords, distance, duration)
      this.cadence = cadence
      this.calcPace()
      this._setDescription()
   }
   calcPace() {
      this.pace = this.duration / this.distance
      return this.pace
   }
}
class Cycling extends Workout {
   type = 'cycling'
   constructor(coords, distance, duration, elevationGain) {
      super(coords, distance, duration)
      this.elevationGain = elevationGain
      this.calcSpeed()
      this._setDescription()
   }
   calcSpeed() {
      this.speed = this.distance / (this.duration / 60)
      return this.speed
   }
}

// const run = new Running([123712, -123213], 4, 178, 123)
// const cycle = new Cycling([123712, -123213], 10, 76, 27)
/////////////////////////
//App architecture
class App {
   #map
   #mapZoom = 13
   #mapE
   #workouts = []
   constructor() {
      // Get users position
      this._getPosition()
      // Get data from localStorage
      this._getLocalStorage()
      // Display marker
      form.addEventListener('submit', this._newWorkout.bind(this))
      // Toogle fields
      inputType.addEventListener('change', this._toggleElevationField)
      // Pan to marker
      clearAll.addEventListener('click', () => { this._removeItems(0, true) })
      containerWorkouts.addEventListener('click', (e) => {
         if (!e.target.classList.contains('btn--delete')) {
            this._moveToPopup(e)
            return
         }
         this.deleteWorkout(e)
      }
      )
   }

   _getPosition() {
      if (navigator.geolocation)
         navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
            alert('Could not get your position')
         })
   }

   _loadMap(position) {
      const { latitude, longitude } = position.coords
      const coords = [latitude, longitude]
      this.#map = leaflet.map('map').setView(coords, this.#mapZoom);

      leaflet.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.#map);

      this.#map.on('click', this._showForm.bind(this))

      this.#workouts.forEach(el => {
         this._renderWorkoutMarker(el);
      })
   }

   _showForm(e) {
      this.#mapE = e
      form.classList.remove('hidden')
      inputDistance.focus()
   }
   _hideForm() {
      inputCadence.value
         = inputDistance.value
         = inputDuration.value
         = inputElevation.value = '';
      form.style.display = 'none'
      form.classList.add('hidden')
      setTimeout(() => form.style.display = 'grid', 1000)
   }

   _toggleElevationField() {
      inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
      inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
   }
   _newWorkout(e) {
      e.preventDefault()
      const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp))
      const isPositive = (...inputs) => inputs.every(inp => inp > 0)

      //Get data from form
      const type = inputType.value
      const distance = +inputDistance.value
      const duration = +inputDuration.value
      const { lat, lng } = this.#mapE.latlng;
      let workout;

      //Check if data is valid

      //If is running create running object
      if (type === 'running') {
         const cadence = +inputCadence.value
         if (
            !validInputs(distance, duration, cadence) ||
            !isPositive(distance, duration, cadence)
         )
            return alert('inputs must be positive numbers');
         workout = new Running([lat, lng], distance, duration, cadence)
      }
      //If is cycling create cycling object
      if (type === 'cycling') {
         const elevation = +inputElevation.value
         if (
            !validInputs(distance, duration, elevation) ||
            !isPositive(distance, duration)
         )
            return alert('inputs must be positive numbers');

         workout = new Cycling([lat, lng], distance, duration, elevation)
      }
      //Add new object to workout array
      this.#workouts.push(workout)

      //Render workout on map as a marker
      this._renderWorkoutMarker(workout)

      //Render workout on list
      this._renderWorkout(workout)

      //Hide form + clear input fields
      this._hideForm()

      //Set to localStorage
      this._setLocalStorage();
   };
   _renderWorkoutMarker(workout) {
      leaflet.marker(workout.coords)
         .addTo(this.#map)
         .bindPopup(leaflet.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
         }))
         .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`)
         .openPopup()

   };
   _removeItems(curElIndex, val) {
      //select marker
      const marker = document.querySelectorAll('.leaflet-marker-icon')
      const leafletPopup = document.querySelectorAll('.leaflet-popup')
      const popupShadow = document.querySelectorAll('.leaflet-marker-shadow')

      //Remove (one) marker components
      if (!val) {
         marker[curElIndex].remove()
         leafletPopup[curElIndex].remove()
         popupShadow[curElIndex].remove()
      }

      //Remove (ALL) marker components
      if (val) {
         localStorage.removeItem('workouts')
         marker.forEach((el, i) => {
            el.remove()
            leafletPopup[i].remove()
            popupShadow[i].remove()
         })
         // Remove all workouts
         Array.from(document.querySelectorAll('.workout')).forEach(el => el.remove())
      }
   }
   _renderWorkout(workout) {
      let html =
         `<li class="workout workout--${workout.type}" data-id="${workout.id}">
         <h2 class="workout__title">${workout.description}</h2>
         <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
         </div>
         <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
         </div>`;

      if (workout.type === 'running') {
         html +=
            `<div class="workout__details">
               <span class="workout__icon">⚡️</span>
               <span class="workout__value">${workout.pace.toFixed(1)}</span>
               <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
               <span class="workout__icon">🦶🏼</span>
               <span class="workout__value">${workout.cadence}</span>
               <span class="workout__unit">spm</span>
            </div>
            <button class="menu-btn btn--edit">Edit</button>
            <button class="menu-btn btn--delete">Delete</button>
         </li>`
      }
      if (workout.type === 'cycling') {
         html +=
            `<div class="workout__details">
               <span class="workout__icon">⚡️</span>
               <span class="workout__value">${workout.speed.toFixed(1)}</span>
               <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
               <span class="workout__icon">⛰</span>
               <span class="workout__value">${workout.elevationGain}</span>
               <span class="workout__unit">m</span>
            </div>
            <button class="menu-btn btn--edit">Edit</button>
            <button class="menu-btn btn--delete">Delete</button>
         </li>`
      }
      form.insertAdjacentHTML('afterend', html)
   };
   _moveToPopup(e) {
      const workoutE = e.target.closest('.workout')
      if (!workoutE) return
      const workout = this.#workouts.find(work => work.id === workoutE.dataset.id)

      this.#map.setView(workout.coords, this.#mapZoom, {
         animate: true,
         pan: {
            duration: 1
         }
      })

      //use the API
      // workout.click()
   };
   _setLocalStorage() {
      localStorage.setItem('workouts', JSON.stringify(this.#workouts));
   };
   _getLocalStorage() {
      const data = JSON.parse(localStorage.getItem('workouts'))

      if (!data) return;

      this.#workouts = data
      this.#workouts.forEach(el => {
         this._renderWorkout(el);
      })
   };
   reset() {
      localStorage.removeItem('workouts');
      location.reload()
   }
   deleteWorkout(e) {
      //Array from all workouts
      const workoutAll = Array.from(document.querySelectorAll('.workout'));

      const curEl = e.target.closest('.workout')

      //get index of element to be deleted
      const curElIndex = Math.abs(
         (workoutAll.indexOf(curEl) - workoutAll.length) + 1
      )

      //Delete item from local storage + remove from form
      this.#workouts.splice(curElIndex)
      this._setLocalStorage()

      //remove marker
      this._removeItems(curElIndex, false)
      if (e.target.closest('.workout')) e.target.closest('.workout').remove()
   }
}
const app = new App()
// Geolocation API



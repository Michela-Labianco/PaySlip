//constants
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

//DOM elements
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]'); //This ensures that the actual checkbox input get manipulate, which is the one that controls the toggle.
const toggleIcon = document.querySelector('#toggle-icon');

// Updates the toggle label and icon based on whether light mode is active
function toggleDarkLightMode(theme) { //theme is expected to be a string

  //idetermine if the current theme is light beacause it checks if the theme string equals the constant LIGHT_THEME
  const isLight = theme === LIGHT_THEME; //isLight is a boolean -> if light isLight will be true; otherwise, it's false.

  // Update the toggle label text based on the theme
  toggleIcon.children[0].textContent = isLight ? 'Light Mode' : 'Dark Mode'; //first child element of the theme-switch-wrapper parent element

  // Replace the icon class to reflect the theme
  toggleIcon.children[1].classList.replace(isLight ? 'fa-moon' : 'fa-sun', //second child element of the theme-switch-wrapper parent element
    isLight ? 'fa-sun' : 'fa-moon'
  );
}

// Handle theme switch
function switchTheme(event) {
  //isDark is just a boolean variable — it's used to clearly represent whether the current theme is dark.
  const isDark = event.target.checked; //to determine if dark mode is selected
  const selectedTheme = isDark ? DARK_THEME : LIGHT_THEME; //set the theme string based on checkbox
  document.documentElement.setAttribute('data-theme', selectedTheme); //to apply the theme as a data attribute on the <html> tag so CSS can react to it
  localStorage.setItem('theme', selectedTheme); //Save the selected theme to the browser so it remembers it on next visit
  toggleDarkLightMode(selectedTheme); // to update the icon/text display based on the theme.
  // if dark is true, isLight = false
}

// When the user changes the toggle switch, call switchTheme()
toggleSwitch.addEventListener('change', switchTheme);


//to apply saved theme on load
const currentTheme = localStorage.getItem('theme'); /// Get the saved theme from local storage (if any)
if (currentTheme) { //to check if one exists
  const isDark = currentTheme === DARK_THEME;
  document.documentElement.setAttribute('data-theme', currentTheme); //apply it to HTML tag
  toggleSwitch.checked = isDark; //set the checkbox switch to match the saved theme
  toggleDarkLightMode(currentTheme); // Update the label and icon accordingly
}

// Converts "HH:MM" to decimal
function parseTimeToDecimal(timeStr) {
  if (typeof timeStr !== 'string' || !timeStr.includes(":")) return 0;

  const [hours, minutes] = timeStr.split(":").map(Number);
  // Split time string into hours and minutes (e.g., "14:30" → ["14", "30"])

  return hours + minutes / 60;
  // Convert minutes into decimal (30 → 0.5), then add to hours

  //to split the string into an array using the colon (:) as the separator
  // .map(Number) -> converts each string element to a number using the built-in Number function
  //often used when parsing times, like converting "12:30" into [12, 30] for hours and minutes
}

// Converts "6pm" or "7:30am" to "18:00" or "07:30"
function convertTo24Hour(timeStr) { //single argument expected to be a string representing time in 12 hour format 
  if (typeof timeStr !== 'string') return "00:00"; //check if the input is not a string. If it isn't it returns a default fallback value "00:00"

  timeStr = timeStr.toLowerCase().trim(); //convert the input to lowercase and remove any spaces
  const match = timeStr.match(/^(\d{1,2})(:(\d{2}))?\s*(am|pm)$/); 

  if (!match) return "00:00"; // If the input doesn't match the expected pattern, return "00:00" as a fallback.

  //match[1] is the first capturing group in the regular expression -> (/^(\d{1,2})(:(\d{2}))?\s*(am|pm)$/)
  let hour = parseInt(match[1]); // extract and convert the hour part of the match into an integer
  const minutes = match[3] ? parseInt(match[3]) : 0; // Extracts and converts the minutes (if present). 
  //If so, it converts them into an integer. If not, it defaults the minutes to 0.

  const period = match[4]; //extract wheter the time is am or pm from the matched string match[4]

  if (period === 'pm' && hour !== 12) hour += 12; //If the time is in the PM (and the hour is not 12), 
  //it adds 12 to convert afternoon hours (1–11 PM) to 24-hour format (13–23).

  if (period === 'am' && hour === 12) hour = 0; //If it's midnight (12 AM), set hour to 0 (since 12 AM in 24-hour time is 00:00).

  //to return time in 24 hour format
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  //hour.toString().padStart(2, '0') to converts the hour to a string and ensures both hour and minutes are always two digits --> 10:30
  //minutes.toString().padStart(2, '0') does the same for minutes
  //: -> it combines them with a colon in between
}

function calculateShift(startStr, endStr, breakMinutes, higherTimeStr) {
  const start = parseTimeToDecimal(startStr); //convert the start time to decimal hours
  const end = parseTimeToDecimal(endStr); //convert the end time to decimal hours
  const higherTime = parseTimeToDecimal(convertTo24Hour(higherTimeStr)); // Convert higherTimeStr to 24-hour format, then to decimal hours
  const breakHours = breakMinutes / 60; //convert break time from minutes to hours

 if (end <= start) return { before: 0, after: 0 };

  const totalWorkedHours = end - start - breakHours;
  if (totalWorkedHours <= 0) return { before: 0, after: 0 };

  // All before higher rate
  if (end <= higherTime) return { before: totalWorkedHours, after: 0 };

  // All after higher rate
  if (start >= higherTime) return { before: 0, after: totalWorkedHours };

  // Spans both
  const hoursBefore = higherTime - start;
  const hoursAfter = end - higherTime;
  const totalSpan = hoursBefore + hoursAfter;

  // Get percentage of each segment, then apply to totalWorkedHours
  const before = (hoursBefore / totalSpan) * totalWorkedHours;
  const after = (hoursAfter / totalSpan) * totalWorkedHours;

  return {
    before,
    after
  };
}

//get correct rate based on day of the week and whether the time is after the higher rate time
function getRate(day, isAfterHigherTime, rates) { 
  if (day === 'sun') return rates.sunday; //if day is equal to ${createDayInput("sun", "Sunday")} then return the sunday rate
  if (day === 'sat') return rates.saturday; //if day is equal to ${createDayInput("sat", "Saturday")} then return the saturday rate
  return isAfterHigherTime ? rates.weekdayHigher : rates.weekday; //return the one that applies to the situation: 
  //during the week if is after the higher time applies higher rate, if not then applies normal weekday rates
}

function calculatePayForDay(day, start, end, breakMin, rates, higherRateTime) {
  const { before, after } = calculateShift(start, end, breakMin, higherRateTime); //split the worked hours into before and after the higher rate time 
  const payBefore = before * getRate(day, false, rates); //pay it with the before rate
  const payAfter = after * getRate(day, true, rates); //pay it with the after rate

  return {
    hours: before + after, //total hours worked before + after 
    pay: payBefore + payAfter //total sum
  };
}

function calculateRawHours(startStr, endStr, breakMinutes = 0) {
  const start = parseTimeToDecimal(startStr);
  const end = parseTimeToDecimal(endStr);
  const breakHours = breakMinutes / 60;

  let total = end - start - breakHours; //total working time subtractin break
  return total > 0 ? total : 0; //if total is positive return it : otherwise return 0
}



//EJS
// Generates HTML for a single day's inputs
function createDayInput(dayCode, dayName) {
  return `
    <div class="day-block">
      <label><strong>${dayName}</strong></label>
      <label>Start: <input type="time" name="start_${dayCode}"></label>
      <label>End: <input type="time" name="end_${dayCode}"></label>
      <label>Break (min): <input style:width:10px; type="number" name="break_${dayCode}" min="0" step="1" value="0"></label>
    </div>
  `;
}

//Adds a week's worth of shift inputs
let weekCount = 1; //to track how many weeks we've added 
//Starting with 1 aligns with how we naturally count weeks, months, days, etc.

// Adds a new set of shift inputs for the week
function addShift() {
  const container = document.getElementById("shiftsContainer");

  // Create the div for this week's shifts
  const div = document.createElement("div");
  div.className = "shift";

  // Fill it with 6 days (Monday to Saturday)
  //using weekCount to label each group of shifts visually in the HTML h4
  //also, when calling the function createDayInput(dayCode, dayName) 
  // dayCode is "mon" and dayName is "Monday" (example)
  div.innerHTML = `
    <h4>Week ${weekCount}</h4>
    <div class="week-row">
      ${createDayInput("mon", "Monday")}
      ${createDayInput("tue", "Tuesday")}
      ${createDayInput("wed", "Wednesday")}
      ${createDayInput("thu", "Thursday")}
      ${createDayInput("fri", "Friday")}
      ${createDayInput("sat", "Saturday")}
      ${createDayInput("sun", "Sunday")}
    </div>
  `;
  container.appendChild(div); //add to the page 
  weekCount++; //increase week counter
}

//DRY principle
function getRateInputsAndHigherTime() {
   //get and analyse(parse) the hourly rates from the input fields
  const rates = {
    weekday: parseFloat(document.getElementById('weekdayRate').value) || 0, //regular week day rate
    weekdayHigher: parseFloat(document.getElementById('weekdayHigherRate').value) || 0, //higher weekday rate
    saturday: parseFloat(document.getElementById('saturdayRate').value) || 0, //sat rate
    sunday: parseFloat(document.getElementById('sundayRate').value) || 0, //sun rate
  };

  //get and process the higher rate time, if provided
  const higherRateTimeStr = document.getElementById('higherRateTime').value.trim(); //get the string value and trim spaces
  const higherRateTime = higherRateTimeStr 
  ? parseTimeToDecimal(convertTo24Hour(higherRateTimeStr)) //convert to 24hrs format and then to decimal hours
  : 0; //default to 0 if no time is given

  return {rates, higherRateTimeStr, higherRateTime};
}

// Collects all filled-out shift inputs and returns them
function getAllShifts() {
  const shiftBlocks = document.querySelectorAll(".shift"); //select all the shift blocks (each representing a week)
  const allShifts = []; //initialize array to store shift data

  const { rates, higherRateTime } = getRateInputsAndHigherTime(); //call the function here
  //rates gives you all the users-entered hourly rate
  //higherRateTime gives you the cutoff time in decimal format after which a weekday shift qualifies for higher pay.

  for (const shift of shiftBlocks) { //loop through each shift block (week)
    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]; //array of all days to check

    //loop through each day of the week
    for (const day of days) {
      //check createDayInput function
      const startInput = shift.querySelector(`input[name="start_${day}"]`); //get start time input for the day
      const endInput = shift.querySelector(`input[name="end_${day}"]`); //get end time input for the day
      const breakInput = shift.querySelector(`input[name="break_${day}"]`); //get break time input for the day

      //only process the shift if both start and end times are provided
      if (startInput?.value && endInput?.value) {
        //this -> breakInput?.value safely tries to access the .value of breakInput
        const breakMinutes = parseFloat(breakInput?.value || 0); //parse break time, default to 0 if empty

        //calculate hours and pay for that using the earlier function
        const { hours, pay } = calculatePayForDay(
          day, startInput.value, endInput.value, breakMinutes, rates, higherRateTime
        );

        //only include with valid, positive hours
        if (!isNaN(hours) && hours > 0) {
          allShifts.push({ hours, rate: pay / hours }); //store them (push) to the original empty array
        }
      }
    }
  }

  return allShifts; //return the list of all valid shifts with calculated pay data
}


//Updates the total hours and pay shown on screen
function updateTotals() {
  //collects the rates from the input fields and converts them to floating point numbers
  const { rates, higherRateTimeStr } = getRateInputsAndHigherTime(); //call the function here

  const hasInvalidRate = Object.values(rates).some(rate => isNaN(rate)); //check for any invalid rate ()
  const payDisplay = document.getElementById("totalsDisplay"); //find the id
  const hourDisplay = document.getElementById("totalsHrsDisplay"); //find the id

  if (hasInvalidRate || !higherRateTimeStr) { //if any rate is invalid or higher rate is missing
    payDisplay.innerHTML = `<h2">Please complete all rate fields to calculate pay</h2>`; //show error message
    hourDisplay.innerHTML = ``; //clear hour display
    return; //exit function early
  }

  const shifts = getAllShifts(); //retrieve all shift data 
  let totalHours = 0; //initialise total hours
  let totalPay = 0; //initialise total pay

  shifts.forEach(({ hours, rate }) => { //loop through each shift 
    console.log(`Shift: ${hours.toFixed(2)}h @ $${rate.toFixed(2)} → $${(hours * rate).toFixed(2)}`);
    //the rate for each shift is calculated and assigned inside the getAllShifts() function.
    totalHours += hours; //add to total hours
    totalPay += hours * rate; //add to total pay
});

  if (shifts.length === 0) { //if no shifts entered
    payDisplay.innerHTML = `<h2>No shift data entered.</h2>`; //show error message
    hourDisplay.innerHTML = ``; //clear hour display
    return; //exit function
  }

  // ✅ Show total hours
  hourDisplay.innerHTML = `<p>⏱️ <strong>Total Hours:</strong> ${totalHours.toFixed(2)} hrs</p>`; //display total hours

  // ✅ Show pay
  payDisplay.innerHTML = `
    <p>💵 <strong>Payslip (before taxes):</strong> $${totalPay.toFixed(2)}</p>
    <a href="https://www.ato.gov.au/single-page-applications/calculatorsandtools?anchor=TWC#TWC/questions" target="_blank">👉🏻 Click here to calculate your taxes</a>
  `;
}


//Handles form submission
document.getElementById("shiftForm").addEventListener("submit", function(e) {
  e.preventDefault(); // prevent the form from reloading the page
  updateTotals(); //call the function to update totals
});


// to automatically add the first week of shifts when the page loads
addShift();

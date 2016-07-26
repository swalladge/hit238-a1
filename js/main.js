
user_endpoint = 'https://quiz.swalladge.id.au/api/user/';
login_endpoint = 'https://quiz.swalladge.id.au/api/login/';
register_endpoint = 'https://quiz.swalladge.id.au/api/register/';
quiz_endpoint = 'https://quiz.swalladge.id.au/api/quiz/';
email = null;
token = null;
Data = {};

function getUserData(success_callback, fail_callback) {

  $.ajax(user_endpoint, {
        jsonp: false,
        dataType: 'json',
        method: 'GET',
        data: {'email': email, 'token': token},
        success: success_callback,
        error: fail_callback
  });
}

function saveUserData(data) {
  Data.user = data;
  console.log(data);
}

function failedLogin(text) {
  $('#form-feedback').text('Login failed: ' + text);
}

function logout() {
  localStorage.clear();
  location.href = '#welcome-page';
}

function login(tempemail, password) {

  var data = {};
  data.password = password;
  data.email = tempemail;

  $.ajax(login_endpoint, {
        jsonp: false,
        dataType: 'json',
        method: 'POST',
        data: JSON.stringify(data),
        success: function(res, textstatus) {
          if (res.success) {
            // redirect to main page
            location.href = '#home-page';
            $('#form-feedback').text('');
            // save the credentials to localstorage for later
            localStorage.token = token = res.data;
            localStorage.email = email = tempemail;
          } else {
            // failed :(
            failedLogin(res.statusText);
          }
        },
        error: function(res, textstatus) {
          failedLogin(res.statusText);
        }
  });
}

// run on page load
$(document).ready( function() {

  // get the email and token from localstorage if available
  email = localStorage.email;
  token = localStorage.token;
  Data = localStorage.Data;
  if (!Data) {
    Data = {};
  }

  if (!(email && token)) {
    // go to the login/register page if no token or username
    location.href = '#welcome-page';
  } else {
    // otherwise, check if the credentials are ok
    getUserData(function(res, textstatus) {
      // if logged in ok, go to the homepage
      if (res.success) {
        saveUserData(res.data);
      } else {
        location.href = '#welcome-page';
      }
    },
    // otherwise redirect to the welcome page
    function(res, textstatus) {
      location.href = '#welcome-page';
    });
  }

  // hijack the login form
  $('#login-form').on('submit', function(e) {
    e.preventDefault();
    var username = $('#email-input').val();
    var password = $('#password-input').val();
    login(username, password);
  });

  $('.logout').on('click', function(e) {
    logout();
  });

});

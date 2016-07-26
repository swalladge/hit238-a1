
user_endpoint = 'https://quiz.swalladge.id.au/api/user/';
login_endpoint = 'https://quiz.swalladge.id.au/api/login/';
register_endpoint = 'https://quiz.swalladge.id.au/api/register/';
quiz_endpoint = 'https://quiz.swalladge.id.au/api/quiz/';
email = null;
token = null;

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
  console.log(data);
}

function failedLogin(text) {
  console.log('login failed: ' + text);
}

function login(tempemail, password, success_callback, fail_callback) {

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
            location.hash = 'home-page';
            console.log(res);
            localStorage.token = token = res.data;
            localStorage.email = email = tempemail;
          } else {
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

  // TODO: for debugging - remove later
  location.hash = '';

  email = localStorage.email;
  token = localStorage.token;

  if (!(email && token)) {
    location.hash = 'welcome-page';
  } else {
    getUserData(function(res, textstatus) {
      if (res.success) {
        saveUserData(res.data);
        location.hash = 'home-page';
      } else {
        location.hash = 'welcome-page';
      }
    },
    function(res, textstatus) {
      console.log('failed to get data');
      console.log(textstatus);
      location.hash = 'welcome-page';
    });
  }

  $('#login-form').on('submit', function(e) {
    e.preventDefault();
    var username = $('#email-input').val();
    var password = $('#password-input').val();
    login(username, password);
  });


});

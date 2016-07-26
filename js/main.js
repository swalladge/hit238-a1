
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

function updateIndex() {
  $.ajax(quiz_endpoint, {
        jsonp: false,
        dataType: 'json',
        method: 'GET',
        data: {'email': email, 'token': token},
        success: function(res, textstatus) {
          if (res.success) {
            Data.quizzes = res.data;

						var indexdata = '';
            for (i = 0; i < Data.quizzes.length; ++i) {
							var item = Data.quizzes[i];
							indexdata += '<div>' + item.name + '</div>';
						}
            $('#quiz-index').html(indexdata);
          } else {
            console.log('failed updating quiz index: ' + textstatus);
          }
        },
        error: function (res, textstatus) {
            console.log('failed updating quiz index: ' + textstatus);
        }
  });
}

function saveUserData(data) {
  Data.user = data;
  console.log(data);
  $('.username').text(Data.user.username);
}

function failedLogin(text) {
  $('#form-feedback').text('Login failed: ' + text);
}

function logout() {
  localStorage.clear();
  location.href = '#welcome-page';
  $('#logout').text('Login');
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
            onLogin();
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

function onLogin() {
  $('#logout-btn').on('click', function(e) {
    e.preventDefault();
    logout();
  });
  $('#logout-btn').text('Logout');
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
        onLogin();
        location.href = '#home-page';
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

  $('#quizzes-page').on('pagebeforeshow', updateIndex());
});

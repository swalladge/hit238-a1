
// global variables for config and state
user_endpoint = 'https://quiz.swalladge.id.au/api/user/';
login_endpoint = 'https://quiz.swalladge.id.au/api/login/';
register_endpoint = 'https://quiz.swalladge.id.au/api/register/';
quiz_endpoint = 'https://quiz.swalladge.id.au/api/quiz/';

email = null;
token = null;

global_data = {};
global_data.fullquizzes = {};

current_quiz = null;
current_question = null;
answers = null;

_.templateSettings.variable = "rc";
quiz_list_template = null;
quiz_template = null;
question_template = null;
results_template = null;
user_template = null;

pages = {
  '#splash-page': onSplashPage,
  '#welcome-page': onWelcomePage,
  '#login-page': onLoginPage,
  '#register-page': onRegisterPage,
  '#home-page': onHomePage,
  '#profile-page': onProfilePage,
  '#quizzes-page': onQuizzesPage,
  '#quiz-page': onQuizPage,
  '#question-page': onQuestionPage
};

// ajax calls for getting data
function getUserData() {
  return $.ajax(user_endpoint, {
        jsonp: false,
        dataType: 'json',
        method: 'GET',
        data: {'email': email, 'token': token},
  });
}

function getQuizIndex() {
  return $.ajax(quiz_endpoint, {
        jsonp: false,
        dataType: 'json',
        method: 'GET',
        data: {'email': email, 'token': token}
  });
}

function getFullQuiz(id) {
  return $.ajax(quiz_endpoint + id, {
        jsonp: false,
        dataType: 'json',
        method: 'GET',
        data: {'email': email, 'token': token}
  });
}

function redrawUserInfo() {
  $('.username').text(global_data.user.username);
  $('#user-info').html(user_template(global_data));
}

function onFailedLogin(text) {
  $('#login-feedback').text('Login failed: ' + text);
}

function logout() {
  localStorage.clear();
  location.href = '#welcome-page';
}

// the login function - attempts login and gives feedback on errors
function login(tempemail, password) {

  $.ajax(login_endpoint, {
        jsonp: false,
        dataType: 'json',
        method: 'POST',
        data: JSON.stringify({'email':tempemail, 'password':password}),
        success: function(res, textstatus) {
          // redirect to main page
          location.href = '#home-page';

          // save the credentials to localstorage for later
          localStorage.token = token = res.data;
          localStorage.email = email = tempemail;

          onLogin();
        },
        error: function(res, textstatus) {
          $('#login-feedback').text('Reason: ' + res.statusText);
          $.mobile.changePage('#login-fail-dialog', {
            transition: 'pop',
            changeHash: false,
            role: 'dialog'
          });
        }
  });
}

function postRegister(tempemail, username, password) {
  return $.ajax(register_endpoint, {
        jsonp: false,
        dataType: 'json',
        method: 'POST',
        data: JSON.stringify({'username': username, 'email':tempemail, 'password':password})
  });
}

function register() {
  var tempemail = $('#register-form input[name=email]').val();
  var username = $('#register-form input[name=username]').val();
  var password = $('#register-form input[name=password]').val();
  console.log(username + tempemail + password);
  postRegister(tempemail, username, password).done(function() {
    $.mobile.changePage('#register-dialog', {
      transition: 'pop',
      changeHash: false,
      role: 'dialog'
    });

  }).fail(function(res, textstatus) {
    $('#register-feedback').text('Reason: ' + res.statusText);
    $.mobile.changePage('#register-fail-dialog', {
      transition: 'pop',
      changeHash: false,
      role: 'dialog'
    });
  });
}



// submits the answers to the quiz, server returns the correct answers for us to
// show a results screen
function submitAnswersToServer(quizid, the_answers) {
  var params = {'email': email, 'token': token};
  $.ajax(quiz_endpoint + quizid + '?' + $.param(params), {
        jsonp: false,
        dataType: 'json',
        method: 'POST',
        data: JSON.stringify({'complete':true, 'answers':the_answers }),
        success: function(res, textstatus) {
            var quiz = global_data.fullquizzes[quizid];
            var data = {
              quiz: quiz,
              results: res.data
            };

            // show results
            $('#quiz-results').html(results_template(data));
						$.mobile.changePage('#results-dialog', {
							transition: 'pop',
							changeHash: false,
							role: 'dialog'
						});
        },
        error: function(res, textstatus) {
          console.log('failed to submit answers: ' + the_answers);
          location.href = '#home-page';
        }
  });
}

// saves the current answers to the server without submitting (allows for saving
// progress in a quiz)
function saveAnswersToServer(quizid, the_answers) {
  var params = {'email': email, 'token': token};
  $.ajax(quiz_endpoint + quizid + '?' + $.param(params), {
        jsonp: false,
        dataType: 'json',
        method: 'POST',
        data: JSON.stringify({'complete':false, 'answers':the_answers }),
        success: function(res, textstatus) {
          _.each(global_data.user.quizzes, function(q) {
            if (q.id == quizid) {
              q.last_answers = the_answers;
            }
          });
          console.log('saved answers');
        },
        error: function(res, textstatus) {
          console.log('failed to save answers');
        }
  });
}

function showQuiz(id) {
  current_quiz = id;
  if (global_data.fullquizzes[id] !== undefined) {
    location.href = '#quiz-page';
  } else {
    getFullQuiz(id).done(function(res, textstatus) {
      global_data.fullquizzes[id] = res.data;
      global_data.fullquizzes[id].id = id;
      $('#quiz-info').html((quiz_template(global_data.fullquizzes[id])));
      location.href = '#quiz-page';
    });
  }
}

function takeQuiz(id) {
  current_quiz = id;
  current_question = 0;
  answers = [];
  for (var i=0; i<global_data.fullquizzes[id].questions.length; i++) {
    answers[i] = 0;
  }
  // load saved answers if available
  _.each(global_data.user.quizzes, function(q) {
    if (q.id == current_quiz) {
      answers = q.last_answers;
    }
  });

  location.href = "#question-page";
}

function submitQuestion() {
  var answer = $('#quiz-option-form [name=quiz-option]:checked').val();
  answers[current_question] = answer;

  var max = global_data.fullquizzes[current_quiz].questions.length - 1;
  if (current_question < max) {
    saveAnswersToServer(current_quiz, answers);
    current_question++;
    onQuestionPage();
  } else {
    submitAnswersToServer(current_quiz, answers);
  }

}

function onLogin() {
  // set up the logout button
  $('#logout-btn').on('click', function(e) {
    e.preventDefault();
    logout();
  });

  getQuizIndex().done(function(res, textstatus) {
    global_data.quizzes = res.data;
    getUserData().done(function(res, textstatus) {
      global_data.user = res.data;
      if (location.hash in pages) {
        pages[location.hash]();
      } else {
        location.href = "#home-page";
      }
    });
  });
}

function onSplashPage() {
  console.log('splashpage');
}

function onWelcomePage() {
  console.log('onWelcomePage');
}

function onLoginPage() {
  console.log('onLoginPage');
}

function onRegisterPage() {
  console.log('onRegisterPage');
}

function onHomePage() {
  console.log('onHomePage');
}

function onProfilePage() {
  console.log('onProfilePage');
  getUserData().done(function (res, textstatus) {
    global_data.user = res.data;
    redrawUserInfo();
  });
}

function onQuizzesPage() {
  console.log('onQuizzesPage');
  if (!global_data.quizzes) {
    location.href = "#home-page";
    return;
  }

  $('#quiz-index').html((quiz_list_template(global_data)));
}

function onQuizPage() {
  console.log('onQuizPage');
  // back to the homepage if no quiz to display
  if (current_quiz == null) {
    location.href = "#home-page";
    return;
  }

  // draw the quiz
  $('#quiz-info').html((quiz_template(global_data.fullquizzes[current_quiz])));

}

function onQuestionPage() {
  console.log('onQuestionPage');
  if (current_question == null || current_quiz == null) {
    location.href = "#home-page";
    return;
  }
  var data = {
    'q': global_data.fullquizzes[current_quiz].questions[current_question],
    'max': global_data.fullquizzes[current_quiz].questions.length,
    'current': current_question + 1 // zero-indexed
  }

  var userquiz = _.find(global_data.user.quizzes, function(quiz){ return quiz.id == current_quiz; });
  if (userquiz) {
    data.saved_answers = userquiz.last_answers;
  }

  $('#quiz-question').html(question_template(data));

}



// run on page load
$(document).ready( function() {

  // get the email and token from localstorage if available
  email = localStorage.email;
  token = localStorage.token;

  // load the underscore js templates
  quiz_list_template = _.template($('#quiz_list_template').html());
  quiz_template = _.template($('#quiz_info_template').html());
  question_template = _.template($('#question_template').html());
  results_template = _.template($('#results_template').html());
  user_template = _.template($('#user_template').html());

  // try to login
  if (!(email && token)) {
    // go to the login/register page if no token or username
    location.href = '#welcome-page';
  } else {
    // otherwise, check if the credentials are ok
    getUserData().done(function(res, textstatus) {
      onLogin();
    }).fail(function(res, textstatus) {
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

  $('#register-form').on('submit', function(e) {
    e.preventDefault();
    register();
  });

  // add functions to call on load each page
  Object.keys(pages).forEach(function(key) {
    $(key).on('pagebeforeshow', pages[key]);
  });


});


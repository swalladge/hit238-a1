
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

results_drawn = null;

_.templateSettings.variable = "rc";
quiz_list_template = null;
quiz_template = null;
question_template = null;
results_template = null;

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
            global_data.quizzes = res.data;
            redrawQuizzes();

          } else {
            console.log('failed updating quiz index: ' + textstatus);
          }
        },
        error: function (res, textstatus) {
            console.log('failed updating quiz index: ' + textstatus);
        }
  });
}

function getFullQuiz(id) {
  $.ajax(quiz_endpoint + id, {
        jsonp: false,
        dataType: 'json',
        method: 'GET',
        data: {'email': email, 'token': token},
        success: function(res, textstatus) {
          if (res.success) {
            global_data.fullquizzes[id] = res.data;
            global_data.fullquizzes[id].id = id;
            $('#quiz-info').html((quiz_template(global_data.fullquizzes[id])));
            location.href = '#quiz-page';
          } else {
            console.log('failed getting quiz: ' + textstatus);
          }
        },
        error: function (res, textstatus) {
            console.log('failed getting quiz: ' + textstatus);
        }
  });
}

function redrawUserInfo() {
  $('.username').text(global_data.user.username);
}

function redrawQuizzes() {
  $('#quiz-index').html((quiz_list_template(global_data)));
}


function onFailedLogin(text) {
  $('#form-feedback').text('Login failed: ' + text);
}

function logout() {
  localStorage.clear();
  location.href = '#welcome-page';
  $('#logout').text('Login');
}

// the login function - attempts login and gives feedback on errors
function login(tempemail, password) {

  $.ajax(login_endpoint, {
        jsonp: false,
        dataType: 'json',
        method: 'POST',
        data: JSON.stringify({'email':tempemail, 'password':password}),
        success: function(res, textstatus) {
          if (res.success) {
            // redirect to main page
            location.href = '#home-page';

            // clear the feedback element
            $('#form-feedback').text('');

            // save the credentials to localstorage for later
            localStorage.token = token = res.data;
            localStorage.email = email = tempemail;

            onLogin();
          } else {
            // failed :(
            onFailedLogin(res.statusText);
          }
        },
        error: function(res, textstatus) {
          onFailedLogin(res.statusText);
        }
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
          if (res.success) {
            drawResults(quizid, res.data);
            location.href = '#quiz-page';
            console.log(res.data);
          } else {
            // failed :(
            console.log('failed to submit answers: ' + the_answers);
          }
        },
        error: function(res, textstatus) {
          console.log('failed to submit answers: ' + the_answers);
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
          if (res.success) {
            console.log('saved answers');
          } else {
            // failed :(
            console.log('failed to save answers');
          }
        },
        error: function(res, textstatus) {
          console.log('failed to save answers');
        }
  });
}

function drawResults(quizid, results_data) {
  console.log('drawing results for quiz ' + quizid);
  results_drawn = quizid;
  var quiz = global_data.fullquizzes[quizid];
  var data = {
    quiz: quiz,
    results: results_data
  };

  $('#quiz-results').html(results_template(data));
}

function showQuiz(id) {
  current_quiz = id;
  console.log(global_data.fullquizzes[id]);
  if (global_data.fullquizzes[id] !== undefined) {
    $('#quiz-info').html((quiz_template(global_data.fullquizzes[id])));
    location.href = '#quiz-page';
  } else {
    getFullQuiz(id);
  }
}

function takeQuiz(id) {
  current_quiz = id;
  current_question = 0;
  answers = [];
  for (var i=0; i<global_data.fullquizzes[id].questions.length; i++) {
    answers[i] = 0;
  }
  location.href = "#question-page";
}

function submitQuestion() {
  var answer = $('#quiz-option-form [name=quiz-option]:checked').val();
  answers[current_question] = answer;

  console.log('answered ' + answer + ' to question ' + current_question);

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
  $('#logout-btn').on('click', function(e) {
    e.preventDefault();
    logout();
  });
  $('#logout-btn').text('Logout');
  updateIndex();
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
}

function onQuizzesPage() {
  console.log('onQuizzesPage');
}

function onQuizPage() {
  console.log('onQuizPage');
  if (results_drawn != current_quiz) {
    $('#quiz-results').html('');
    results_drawn = null;
  }

}

function onQuestionPage() {
  console.log('onQuestionPage');
  if (current_question == null || current_quiz == null) {
    return;
  }
  var data = {
    'q': global_data.fullquizzes[current_quiz].questions[current_question],
    'max': global_data.fullquizzes[current_quiz].questions.length,
    'current': current_question + 1 // zero-indexed
  }

  var userquiz = _.find(global_data.user.quizzes, function(quiz){ return quiz.id == current_quiz; });
  if (userquiz) {
    data.saved_answers = userquiz.answers;
  }

  $('#quiz-question').html(question_template(data));

}



// run on page load
$(document).ready( function() {

  // get the email and token from localstorage if available
  email = localStorage.email;
  token = localStorage.token;

  quiz_list_template = _.template($('#quiz_list_template').html());
  quiz_template = _.template($('#quiz_info_template').html());
  question_template = _.template($('#question_template').html());
  results_template = _.template($('#results_template').html());

  // try to login
  if (!(email && token)) {
    // go to the login/register page if no token or username
    location.href = '#welcome-page';
  } else {
    // otherwise, check if the credentials are ok
    getUserData(function(res, textstatus) {
      // if logged in ok, go to the homepage
      if (res.success) {
        global_data.user = res.data;
        onLogin();
        if (location.hash in pages) {
          pages[location.hash]();
        } else {
          location.href = '#home-page';
        }
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

  // add functions to call on load each page
  Object.keys(pages).forEach(function(key) {
    $(key).on('pagebeforeshow', pages[key]);
  });


});

// TODO: use global_data.user.quizzes[id] to pre-fill questions in template
// (saving previously entered answers)

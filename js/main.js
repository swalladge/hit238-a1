
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

stay_pages = {
  '#home-page': onHomePage,
  '#profile-page': onProfilePage,
  '#quizzes-page': onQuizzesPage,
  '#quiz-page': onQuizPage,
  '#question-page': onQuestionPage
};

// display the ajax error dialog, with error message
function showAjaxError(res, textstatus, error, title) {
  var msg;

  // check if it was an error generated from the server or the client
  if (res && res.status >= 400) {
    msg = res.status;
    $('#ajax-fail-internet').html('');
    if (title) { $('#ajax-fail-title').html(title);}
    else       { $('#ajax-fail-title').html('Server Request Failed');}
  } else {
    $('#ajax-fail-title').html('Server Request Failed');
    $('#ajax-fail-internet').html(
      'Please check your internet connection. If your connection is ok and the problem persists, please contact the <a href="https://swalladge.id.au">webmaster</a>.'
    );
  }

  // build up the rest of the message
  msg = msg + ' ' + textstatus;
  if (textstatus && error) {
    msg = msg + ' (' + error + ')';
  }
  $('#ajax-fail-feedback').html(msg);

  // open the message dialog
  $.mobile.changePage('#ajax-fail-dialog', {
    transition: 'pop',
    changeHash: false,
    role: 'dialog'
  });
}

// ajax calls for getting data
function getUserData() {
  return $.ajax(user_endpoint, {
        jsonp: false,
        dataType: 'json',
        method: 'GET',
        data: {'email': email, 'token': token},
        error: showAjaxError
  });
}

function getQuizIndex() {
  return $.ajax(quiz_endpoint, {
        jsonp: false,
        dataType: 'json',
        method: 'GET',
        error: showAjaxError,
        data: {'email': email, 'token': token}
  });
}

function getFullQuiz(id) {
  return $.ajax(quiz_endpoint + id, {
        jsonp: false,
        dataType: 'json',
        method: 'GET',
        error: showAjaxError,
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
        error: function(res, textstatus, error) {
          showAjaxError(res, textstatus, error, "Login Failed");
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
  postRegister(tempemail, username, password).done(function() {
    $.mobile.changePage('#register-dialog', {
      transition: 'pop',
      changeHash: false,
      role: 'dialog'
    });

  }).fail(function(res, textstatus, error) {
    showAjaxError(res, textstatus, error, "Register Failed");
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
							transition: 'slideup',
							changeHash: false,
							role: 'dialog'
						});

            // refresh the quizzes view
            getUserData().done( function(res, textstatus) {
              global_data.user = res.data;
              redrawQuizzes();
              redrawQuiz();
            });

        },
        error: function(res, textstatus, error) {
          location.href = '#home-page';
          showAjaxError(res, textstatus, error);
        }
  });
}

// saves the current answers to the server without submitting (allows for saving
// progress in a quiz)
function saveAnswersToServer(quizid, the_answers, callback) {
  var params = {'email': email, 'token': token};
  $.ajax(quiz_endpoint + quizid + '?' + $.param(params), {
        jsonp: false,
        dataType: 'json',
        method: 'POST',
        data: JSON.stringify({'complete':false, 'answers':the_answers }),
        success: function(res, textstatus) {
          var done = false;
          for (n in Object.keys(global_data.user.quizzes)) {
            if (global_data.user.quizzes[n].id == quizid) {
              global_data.user.quizzes[n].last_answers = the_answers;
              done = true;
            }
          }
          if (!done) {
            global_data.user.quizzes.push({'attempts': 0, 'id':quizid, 'last_answers':the_answers});
          }

          // call the optional callback now it's finished
          if (callback) {
            callback();
          }
          console.log('saved answers');
        },
        error: function(res, textstatus, error) {
          showAjaxError(res, textstatus, error);
        }
  });
}

function showQuiz(id) {
  current_quiz = id;
  $.mobile.changePage('#quiz-page', {
    transition: 'slide',
    changeHash: true,
    role: 'page'
  });
}

function takeQuiz(id) {
  current_quiz = id;
  current_question = 0;
  answers = [];
  for (var i=0; i<global_data.fullquizzes[current_quiz].questions.length; i++) {
    answers[i] = 0;
  }
  // load saved answers if available
  _.each(global_data.user.quizzes, function(q) {
    if (q.id == current_quiz) {
      answers = q.last_answers;
    }
  });

  $.mobile.changePage('#question-page', {
    transition: 'slide',
    changeHash: true,
    role: 'page'
  });
}


// resets saved answers for the given quiz
function resetQuiz(quizid) {

  _.each(global_data.user.quizzes, function(q) {
    if (q.id == quizid) {
      for (var i=0; i<q.last_answers.length; i++) {
        q.last_answers[i] = 0;
      }
      // save the reset answers, and redraw the quiz page when done
      saveAnswersToServer(quizid, q.last_answers, redrawQuiz);
    }
  });

}

function submitAnswer(next) {
  var answer = $('#quiz-option-form [name=quiz-option]:checked').val();
  // NOTE: current_question zero-indexed in code, but one-indexed in template
  answers[current_question] = answer;

  var max = global_data.fullquizzes[current_quiz].questions.length - 1;
  if (current_question < max || (!next)) {
    saveAnswersToServer(current_quiz, answers);
    if (next) {
      current_question++;
    } else {
      if (current_question > 0) {
        current_question--;
      }
    }
    
    $.mobile.changePage('#question-page', {
      transition: 'fade',
      changeHash: true,
      role: 'page',
      allowSamePageTransition: true
    });
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
      if (location.hash in stay_pages) {
        pages[location.hash]();
      } else {
        location.href = "#home-page";
      }
    });
  });
}

function redrawQuizzes() {
  $('#quiz-index').html((quiz_list_template(global_data)));
}

function redrawQuiz() {
  var data = {
    'quiz': global_data.fullquizzes[current_quiz],
    'userquiz': _.find(global_data.user.quizzes, function(q){return q.id == current_quiz;})
  };


  $('#quiz-info').html(quiz_template(data));
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
  if (!(global_data.quizzes && global_data.user)) {
    return;
  }
  redrawQuizzes();
}

function onQuizPage() {
  console.log('onQuizPage');
  // back to the quiz list if no quiz to display
  if (current_quiz == null) {
    location.href = "#quizzes-page";
    return;
  }
  if (global_data.fullquizzes[current_quiz] !== undefined) {
    redrawQuiz();
  } else {
    getFullQuiz(current_quiz).done(function(res, textstatus) {
      global_data.fullquizzes[current_quiz] = res.data;
      global_data.fullquizzes[current_quiz].id = current_quiz;
      redrawQuiz();
    });
  }

}

function onQuestionPage() {
  console.log('onQuestionPage');
  if (current_question == null || current_quiz == null) {
    location.href = "#quizzes-page";
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

function search() {
  global_data.search_string = $('#search-input').val().toLowerCase().trim();
  redrawQuizzes();
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
    }).fail(function(res, textstatus, error) {
      if (res.status == 401) {
        location.href = '#welcome-page';
      } else {
        showAjaxError(res, textstatus, error);
      }
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

  // instant search function
  $('#search-input').on('keyup', search);

  $.mobile.defaultPageTransition = 'none';
  $.mobile.defaultDialogTransition = 'none';


});



# HIT238 Quiz webapp

A webapp for Assignment 1, HIT238. Copyright © 2016 Samuel Walladge

## What is it?

A web app targeted at small-screen devices, designed for general purpose, test-yourself, trivia/quiz taking.

## Info

The web app is statically generated using Jekyll. This enables a neat project structure, use of preprocessors, and
simple to change things like the subpath of where it is hosted. 

Liquid templates are used for neat html page development with more
[DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself), and Sass css preprocessing for things like variables in
css for easier consistency.

To build a hostable version of the app, edit `_config.yml` to ensure config such as the baseurl are set as required,
and then run `jekyll build` from the project directory. This will output all the files for the site under the `_site`
directory. These can be copied directory to the web server where they are to be hosted.

In the web app itself, jQuery Mobile is used as the web framework, with a custom theme generated with
[ThemeRoller](http://themeroller.jquerymobile.com/). jQuery and Underscore.js are heavily used throughout, especially
for ajax calls, data manipulation, DOM manipulation, and template rendering (for displaying data in the app).

A live hosted version can be found at [https://quiz.swalladge.id.au](https://quiz.swalladge.id.au).


## Features

- Communicates via ajax with a server created specifically for this.
- Loads quizzes from the server (allows for easily adding/modifying quizzes separately from the webapp code).
- Multiple quizzes available to take; web app will support a potentially large number of quizzes, and any number of
  questions per quiz.
- Quizzes have multiple choice questions with a "don't know" option.
- Able to take quizzes multiple times, with statistics kept on number of attempts and best score achieved.
- User accounts (login, register)
- View statistics such as total number of quizzes taken.
- Quiz answers are saved (automatically and instantly) to your account for resuming quizzes later from any device.
- Ability to reset saved answers.
- Search bar to find a quiz quickly.
- Interface designed for accessibility on small screens.


## Libraries and Tech Used

- [Jekyll](http://jekyllrb.com/): static site generator
- [Liquid](https://shopify.github.io/liquid/): for templates used in generating the web app
- [Sass](http://sass-lang.com/): for fancy css things like variables
- [jQuery](http://jquery.com/): for manipulating the DOM and other things.
- [jQuery Mobile](http://jquerymobile.com/): the web framework used - simple and pretty
- [Underscore.js](http://underscorejs.org/): for useful functions to operate on lists and other data
- [Bower](https://bower.io/): for managing some libraries, including
  [normalize.css](http://necolas.github.io/normalize.css/) for consistent base css
  styles

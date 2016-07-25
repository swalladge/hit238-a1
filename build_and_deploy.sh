#!/bin/bash

git status

printf 'Ok to push live? [Y/n] '

read R

if [ "$R" = "" -o "$R" = "y" -o "$R" = "Y" ]
then
    jekyll build && rsync -av --delete --delete-excluded _site/ samuel@quiz.swalladge.id.au:/usr/share/nginx/quiz_html/
else
    echo "Aborting"
fi


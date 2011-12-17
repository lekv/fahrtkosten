#!/bin/bash

git push
ssh v5 "cd /var/www/kunden/lekv.de/fahrtkosten; git pull;"

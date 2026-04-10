#!/usr/bin/bash

#
#   Run the app with the console channel
#

npm run build && source set-env.sh && npm start -- --channel=console "$@"

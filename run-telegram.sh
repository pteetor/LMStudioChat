#!/usr/bin/bash

#
#   Run the app with the Telgram channel
#

npm run build && source set-env.sh && npm start -- --channel=telegram

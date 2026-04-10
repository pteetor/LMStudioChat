#!/usr/bin/bash

#
#   Run the app with the Telgram channel
#

if npm run build && source set-env.sh
then
    npm start -- --channel=telegram "$@"
fi

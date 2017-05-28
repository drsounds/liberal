# Codename: Liberal
Open source desktop client for Spotify based on Spotify Web API writte in Node.JS.

Spotify is a copyrighted trademark by Spotify AB. Code licensed under MIT.

# Installation


1. Clone the repository

    git clone git@github.com:drsounds/liberal
    cd liberal

2. Assign an Spotify app key, client secret and redirect uri:

    {
        "client_id": "<your app client id>",
        "client_secret": "<your app client secret>",
        "redirect_uri": "http://localhost:9261"
    }

Save this into a a file spotify.key.json in the folder ~/.bungalow/

3. cd into the app folder, and do the following

    npm install
    electron .

Or you can run it from a browser (Chrome is the only working only currently since it make use of Web Components)

    http://localhost:9261

Log in with Spotify here

    http://localhost:9261/internal/login


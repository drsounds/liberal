NOTE This is currently work in progress, and I haven't managed to got it to work locally yet. I am trying to work it out soon.
# Codename: Liberal
Open source desktop client for Spotify based on Spotify Web API writte in Node.JS.

Spotify is a copyrighted trademark by Spotify AB. Code licensed under MIT.

# Installation


1. Clone the repository

```sh
    git clone git@github.com:drsounds/liberal
    cd liberal
```

2. Assign an Spotify app key, client secret and redirect uri into the file ~/.bungalow/spotify.key.json

```json
    {
        "client_id": "<your app client id>",
        "client_secret": "<your app client secret>",
        "redirect_uri": "http://localhost:9261"
    }
```

3. cd into the app folder, and do the following

```bash
    npm install
    electron .

```

Or you can run it from a browser (Chrome is the only working only currently since it make use of Web Components)

```bash
    http://localhost:9261
```

Log in with Spotify here

```
    http://localhost:9261/internal/login
```

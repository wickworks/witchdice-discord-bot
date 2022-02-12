# witchdice-discord-bot
Discord integration for witchdice.com

Invite with permissions link:
https://discord.com/api/oauth2/authorize?client_id=937850556272226374&permissions=67584&scope=bot%20applications.commands

Initial implementation by Shotch

## Start the server:
node index.js

Join a room by just adding it to room.json so the production bot doesn't know about it.


## Watch the server on Google Compute Engine:
pm2 logs

## Deploy an update
- Update the deployed branch to main.
- SSH into the cloud
- cd witchdice-discord-bot
- pm2 kill
- git pull
- pm2 start index.js
- pm2 save


## Installation Steps (if applicable)

1. Clone repo
2. Run `npm install`
3. Add Discord credentials in a `.env` file		(`cat > .env`, then paste in)
4. Add config.json as outlined below
5. Add firebase_auth.json as outlined below
6. `cat > room.json`, then put in empty brackets: `{}`
6. Run `node index.js`
7. Interact with your Discord bot via your web browser

## Environment files:
### .env
`DISCORD_TOKEN=BOT TOKEN HERE
GOOGLE_APPLICATION_CREDENTIALS=./firebase_auth.json`

### config.json
`{
	"clientId": "937850556272226374",
	"guildId": "DEV GUILD HERE",
	"token": "BOT TOKEN HERE"
}`

### .firebase_auth.json  (this is generated in firebase)
`{
  "type": "service_account",
  "project_id": "roll-to-hit",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "",
  "token_uri": "",
  "auth_provider_x509_cert_url": "",
  "client_x509_cert_url": ""
}`

## Starting up a VM instance in google cloud

`sudo apt-get -y update`

### upgrade node to 16+
`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash`
`source ~/.bashrc`
`nvm install v16.13.2`

`git clone https://github.com/wickworks/witchdice-discord-bot.git`

< follow the below installation steps >

`sudo npm install -g pm2`
`cd witchdice-discord-bot`
`git checkout deployed`
`git pull`
`pm2 start index.js`
`pm2 save`

# witchdice-discord-bot
Discord integration for witchdice.com

It allows users to subscribe a Discord channel to a Witchdice room using `/join-room ROOMNAME`, see their current room with `/current-room`, and leave a room with `/leave-room`

Initial implementation by Shotch.

Invite with permissions link:
https://discord.com/api/oauth2/authorize?client_id=937850556272226374&permissions=67584&scope=bot%20applications.commands

Development app:
https://discord.com/api/oauth2/authorize?client_id=947213521056321648&permissions=67584&scope=bot%20applications.commands


## Develop locally locally:
- node index.js
- open discord channel with the development bot invited
- tell that bot to listen to a room if it's not already
- open that room on witchdice.com and make rolls
- make modifications and restart the node server to see them

## Publish slash commands
Comment/uncomment the guild-specific or global command publishing lines in deploy-commands.js
(highly recommend developing on a specific guild; the global commands take up to an hour to propogate.)

node deploy-commands.js


## Watch the server on Google Compute Engine:
pm2 logs


## Deploy an update
- Merge `deployed` branch to `main`.
- SSH into the cloud
- cd witchdice-discord-bot
- pm2 kill
- git checkout deployed
- git pull
- pm2 start index.js


## Installation Steps
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
```
DISCORD_TOKEN=BOT TOKEN HERE
GOOGLE_APPLICATION_CREDENTIALS=./firebase_auth.json
```

### config.json
```
{
	"clientId": "DISCORD CLIENT ID HERE",
	"guildId": "DEV GUILD HERE",
	"token": "BOT TOKEN HERE"
}
```

### .firebase_auth.json  (this is generated in firebase)
```
{
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
}
```

## Starting up a VM instance in google cloud

`sudo apt-get -y update`

### upgrade node to 16+
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
source ~/.bashrc
nvm install v16.13.2

git clone https://github.com/wickworks/witchdice-discord-bot.git
```

< follow the below installation steps >

```
sudo npm install -g pm2
cd witchdice-discord-bot
git checkout deployed
git pull
pm2 start index.js
pm2 save
```

# witchdice-discord-bot
Discord integration for witchdice.com


Invite with permissions link:
https://discord.com/api/oauth2/authorize?client_id=937850556272226374&permissions=294205384768&scope=bot%20applications.commands


## Environment files:

### config.json
{
	"clientId": "937850556272226374",
	"guildId": "DEV GUILD HERE",
	"token": "BOT TOKEN HERE"
}

### .env
DISCORD_TOKEN=BOT TOKEN HERE
GOOGLE_APPLICATION_CREDENTIALS=./firebase_auth.json

### .firebase_auth.json  (this is generated in firebase)
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



## Installation Steps (if applicable)

1. Clone repo
2. Run `npm install`
3. Add Discord credentials in a `.env` file
3. Run `node index.js`
4. Interact with your Discord bot via your web browser

import os
import discord
import requests
import json
import asyncio

from monitor_streams import MonitorStreams

from discord.ext import commands
from dotenv import load_dotenv


load_dotenv()
WITCHBOT_TOKEN = os.getenv('WITCHBOT_TOKEN')

bot = commands.Bot(command_prefix='~', description='Witchdice Discord Integration')

if __name__ == '__main__':
    bot.add_cog(MonitorStreams(bot))

@bot.event
async def on_ready():
    print(f'\n\nLogged in as: {bot.user.name} - {bot.user.id}\nVersion: {discord.__version__}\n')

bot.run(WITCHBOT_TOKEN, bot=True, reconnect=True)

# if __name__ == "__main__":
#     test_roll = {
#         "conditions": "low",
#         "createdAt": 1638743577914,
#         "name": "TestTest",
#         "roll-0": {"dieType": "d20", "result": 14, "sign": 1},
#         "roll-1": {"dieType": "d12", "result": 10, "sign": 1},
#         "roll-2": {"dieType": "d12", "result": 6, "sign": 1},
#         "roll-3": {"dieType": "d8", "result": 8, "sign": 1},
#         "type": "dicebag",
#         "updatedAt": 1638743577914,
#     }
#
#     parse_roll(test_roll)
#
#     bot.run(WITCHBOT_TOKEN)

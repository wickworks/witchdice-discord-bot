import os
import json
# import pyrebase

import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

import discord
from discord.ext import tasks, commands


class MonitorStreams(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

        # # configure firebase db connection
        # config = {
        #     "apiKey": os.getenv('FIREBASE_API_KEY'),
        #     "authDomain": "roll-to-hit.firebaseapp.com",
        #     "databaseURL": "https://roll-to-hit.firebaseio.com",
        #     "storageBucket": "roll-to-hit.appspot.com"
        # }
        # self.db = pyrebase.initialize_app(config).database()

        # Fetch the service account key JSON file contents
        cred = credentials.Certificate('firebase_auth.json')
        #
        # Initialize the app with a None auth variable, limiting the server's access
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://roll-to-hit.firebaseio.com',
            'databaseAuthVariableOverride': None
        })

        # initialize the room and stream variables
        self.rooms = {}

    def cog_unload(self):
        print('   Unloading monitor_streams cog, have a nice day.')


    @commands.Cog.listener()
    async def on_ready(self):
        print('Waiting for bot to be ready...')
        await self.bot.wait_until_ready()

        print("Loading Rooms")
        self.rooms = json.load(open('rooms.json', 'r'))

        print("Listening for rolls:")
        try:
            firebase_admin.db.reference("rolls").listen(self.roll_stream_handler)
        except Exception as e:
            print(e)

    # #
    # # Process data coming from Witchdice
    async def roll_stream_handler(self, message):
        print(f"      roll_stream_handler for message {message}")
        #
        # data = message["data"]
        # room_name = message["stream_id"]
        #
        # if room_name in self.rooms.keys():
        #     for channel_id in self.rooms[room_name]:
        #         channel = self.bot.get_channel(int(channel_id))
        #
        #         embed = parse_roll(data)
        #
        #         try:
        #             print(f"     sending a buncha data to discord...")
        #             # await channel.send(f"_{data.get('name', '[UNKNOWN]')}_", embed=embed)
        #             await channel.send('hi!')
        #             print('          finished send')
        #
        #         except KeyError as e:
        #             print(e)
        # else:
        #     print(f"{room_name}: Not found in current list of rooms... what?")
        #
        # print('-- finished handling a roll stream event ---')


    # ==================================================================
    # ======================= TEXT COMMANDS ============================
    # ==================================================================

    @commands.command(name='join', pass_context=True)
    async def join_room(self, ctx, room_name: str):
        print(f"ADDING ROOM {room_name}")
        stripped_room_name = room_name.strip()

        if stripped_room_name in self.rooms.keys():
            self.rooms[stripped_room_name] = self.rooms[stripped_room_name].append(ctx.message.channel.id)
        else:
            self.rooms[stripped_room_name] = [ctx.message.channel.id]
            self.create_stream(stripped_room_name)

            print('    saving to rooms.json')
            open('rooms.json', 'w').write(json.dumps(self.rooms, indent=2))
            # self.rooms = json.load(open('rooms.json', 'r'))




def parse_roll(roll_msg_data):
    print(roll_msg_data)

    content_text = ""  # goes in message content
    decorative_text = ""  # goes in embed author name
    result_text = ""  # goes in embed title
    rolls_text = ""  # goes in embed description

    summary_mode = roll_msg_data.get("conditions")  # total | high | low

    # extracts the roll objects from the firebase data
    all_rolls = [roll[1] for roll in roll_msg_data.items() if "roll" in roll[0]]

    # Collect all results by dietype e.g. {'d4':[2,3,3], 'd20':[20]}
    results_by_dietype = {}
    for roll in all_rolls:
        dietype = roll["dieType"]
        result = roll["result"]
        if dietype in results_by_dietype:
            results_by_dietype[dietype].append(result)
        else:
            results_by_dietype[dietype] = [result]

    # ~ character name ~
    content_text = roll_msg_data.get("name", "[UNKNOWN]")

    # ~ extra decorative text ~
    decorative_text = "🌺 💀 🌺"

    # ~ summary // total ~
    if summary_mode == "total":
        all_values = [val["result"] for val in all_rolls if "result" in val.keys()]
        result_text = str(sum(all_values)).rjust(2, " ")

    if summary_mode == "high":
        high_values = [max(results) for results in results_by_dietype.values()]
        result_text = str(sum(high_values)).rjust(2, " ")

    if summary_mode == "low":
        low_values = [min(results) for results in results_by_dietype.values()]
        result_text = str(sum(low_values)).rjust(2, " ")

    result_text = f"-{{ {result_text} }}-"

    # ~ what-was-rolled graph ~    (or one-liner if it was a simple roll)
    if len(all_rolls) == 1:
        rolls_text = f"```-{{ {list(results_by_dietype)[0]} }}-```"

    else:
        # first "column" is five spaces wide, "total" | "  min" | "  max"
        type_line = " " * 5
        mode_text = {"low": "min", "high": "max", "total": "total"}
        results_line = (
            mode_text[summary_mode] if summary_mode in mode_text else ""
        ).rjust(5, " ")

        # the following columns are: die type on top, results grouped below.
        group_join_char = "+" if summary_mode == "total" else ","
        for dietype in results_by_dietype:

            # die type is easy
            type_column = str(dietype)

            # results need to be joined together with either a comma or plus, depending on the summation mode
            result_strings = [str(result) for result in results_by_dietype[dietype]]
            result_column = f"({group_join_char.join(result_strings)})"

            # everything but the last group gets a +
            if dietype != list(results_by_dietype)[-1]:
                result_column += " +"

            # keep the column the same length by padding the shorter row with spaces
            column_width = max(len(type_column), len(result_column))
            type_column = type_column.ljust(column_width, " ")
            result_column = result_column.ljust(column_width, " ")

            type_line += f" {type_column}"
            results_line += f" {result_column}"

        rolls_text = f"```{type_line}\n{results_line}```"

    # print(content_text)
    # print(decorative_text)
    # print(result_text)
    # print(rolls_text)

    # TODO: content_text needs to get to the bot.say() somehow; either return it alongside the embed or just do the .get("name") out there.
    embed = discord.Embed(
        title=result_text,
        description=rolls_text,
        color=discord.Color(int("0x511D20", 16)),
    )  # Mutter the incantation and perform the hex
    embed.set_author(name=decorative_text)

    # embed.set_footer(text="room-name-here")
    # embed.set_image()
    # embed.set_thumbnail()

    # Can't have empty fiends or it gets mad. { Olive: that github visualizer seemed to think that [] was an ok value for "fields"? Can we skip it? }
    # if field_text == "":
    #     field_text = "[UNK]"
    # if embed_text.strip() == "":
    #     embed_text = "[UNK]"
    #
    # embed.add_field(name=field_text, value=embed_text, inline=False)

    return embed

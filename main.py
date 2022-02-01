import discord
import pyrebase
import requests
import json
import asyncio

from discord.ext import commands

bot = commands.Bot(command_prefix='~', description='Witch Dice Discord Integration')

config = {
    "apiKey": "AIzaSyBQJ2LG4nrCBhoIxg94rYi7AzzNf-GqgTM",
    "authDomain": "roll-to-hit.firebaseapp.com",
    "databaseURL": "https://roll-to-hit.firebaseio.com",
    "storageBucket": "roll-to-hit.appspot.com"
}

firebase = pyrebase.initialize_app(config)
db = firebase.database()

rooms = {}


async def roll_stream_handler(message):
    global rooms

    data = message["data"]
    room_name = message["stream_id"]

    if room_name in rooms.keys():
        for channel_id in rooms[room_name]:
            channel = bot.get_channel(int(channel_id))

            embed = parse_roll(data)

            try:
                await channel.send(f"_{data.get('name', '[UNKNOWN]')}_", embed=embed)

            except KeyError as e:
                print(e)
    else:
        print(f"{room_name}: Not found in current list of rooms... what?")


@bot.command(pass_context=True)
async def add_room(ctx, room_name: str):
    global rooms
    l_room_name = room_name.strip().lower()

    if l_room_name in rooms.keys():
        rooms[l_room_name] = rooms[l_room_name].append(ctx.message.channel.id)
    else:
        rooms[l_room_name] = [ctx.message.channel.id]
        create_stream(l_room_name)

    # Save the re-load room
    open('rooms.json', 'w').write(json.dumps(rooms, indent=2))
    rooms = json.load(open('rooms.json', 'r'))


async def room_check():
    global rooms
    streams = {}

    print("Loading Rooms")
    rooms = json.load(open('rooms.json', 'r'))

    await bot.wait_until_ready()

    print("Creating Streams")
    for stream_path in set(rooms.keys()):
        streams[stream_path] = create_stream(stream_path)

    print("Looping")
    while True:
        print("Beep")
        for stream_name, stream_feed in streams.items():
            for msg in stream_feed:
                if msg:
                    msg_data = json.loads(msg.data)
                    msg_data["event"] = msg.event
                    msg_data["stream_id"] = stream_name

                    await roll_stream_handler(msg_data)

        print("Boop")
        await asyncio.sleep(1)


def create_stream(room_name):
    try:
        stream = db.child("rolls").child(room_name)
        sse = pyrebase.pyrebase.ClosableSSEClient(stream.build_request_url(None), session=pyrebase.pyrebase.KeepAuthSession(), build_headers=stream.build_headers)

        return sse

    except requests.exceptions.HTTPError as e:
        print(e)
        return None


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


if __name__ == "__main__":
    test_roll = {
        "conditions": "low",
        "createdAt": 1638743577914,
        "name": "TestTest",
        "roll-0": {"dieType": "d20", "result": 14, "sign": 1},
        "roll-1": {"dieType": "d12", "result": 10, "sign": 1},
        "roll-2": {"dieType": "d12", "result": 6, "sign": 1},
        "roll-3": {"dieType": "d8", "result": 8, "sign": 1},
        "type": "dicebag",
        "updatedAt": 1638743577914,
    }

    parse_roll(test_roll)

    bot.loop.create_task(room_check())

    # bot.run(open('token.txt', 'r').read())
    bot.run(os.getenv('WITCHBOT_TOKEN'))

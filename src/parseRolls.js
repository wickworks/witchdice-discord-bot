const { MessageEmbed } = require('discord.js');


module.exports = function parseRoll(rollSnapshot, roomName) {
    console.log('rollSnapshot',rollSnapshot)

    let content_text = ""  // goes in message content
    let decorative_text = ""  // goes in embed author name
    let result_text = ""  // goes in embed title
    let rolls_text = ""  // goes in embed description

    let summary_mode = rollSnapshot["conditions"]  // total | high | low

    console.log('summary_mode',summary_mode);

    // extracts the roll objects from the firebase data into just an array
    // all_rolls = [roll[1] for roll in rollSnapshot.items() if "roll" in roll[0]]
    allRolls = Object.keys(rollSnapshot)
      .filter(eventKey => eventKey.startsWith('roll-'))
      .map(rollKey => rollSnapshot[rollKey])

    // Collect all results by dietype e.g. {'d4':[2,3,3], 'd20':[20]}
    // results_by_dietype = {}
    // for roll in all_rolls:
    //     dietype = roll["dieType"]
    //     result = roll["result"]
    //     if dietype in results_by_dietype:
    //         results_by_dietype[dietype].append(result)
    //     else:
    //         results_by_dietype[dietype] = [result]
    resultsByDieType = {}
    allRolls.forEach(roll => {
      const dieType = roll.dieType;
      const result = roll.result;
      if (resultsByDieType[dieType]) {
        resultsByDieType[dieType].push(result)
      } else {
        resultsByDieType[dieType] = [result]
      }
    })

    // ~ character name ~
    content_text = rollSnapshot["name"] || "[UNKNOWN]"

    // ~ extra decorative text ~
    decorative_text = "🌺 💀 🌺"

    // ~ summary // total ~
    if (summary_mode === "high") {
      const high_values = Object.keys(resultsByDieType).map(dieType => Math.max(...resultsByDieType[dieType]))
      const sum = high_values.reduce((a,b) => a+b)
      result_text = String(sum).padEnd(2, " ")

    } else if (summary_mode === "low") {
      const low_values = Object.keys(resultsByDieType).map(dieType => Math.min(...resultsByDieType[dieType]))
      const sum = low_values.reduce((a,b) => a+b)
      result_text = String(sum).padEnd(2, " ")

    } else { // "total"
      const all_values = allRolls.map(roll => roll.result)
      const sum = all_values.reduce((a,b) => a+b)
      result_text = String(sum).padEnd(2, " ")
      console.log('all_values',all_values);
      console.log('sum',sum);
      console.log('result_text',result_text);
    }





    result_text = `-{{ ${result_text} }}-`

    // ~ what-was-rolled graph ~    (or one-liner if it was a simple roll)
    if (allRolls.length === 1) {
      rolls_text = `\`\`\`-{{ ${allRolls[0].result} }}-\`\`\``

    } else {
      // // first "column" is five spaces wide, "total" | "  min" | "  max"
      // type_line = " " * 5
      // mode_text = {"low": "min", "high": "max", "total": "total"}
      // results_line = (
      //     mode_text[summary_mode] if summary_mode in mode_text else ""
      // ).rjust(5, " ")
      //
      // // the following columns are: die type on top, results grouped below.
      // group_join_char = "+" if summary_mode == "total" else ","
      // for dietype in results_by_dietype:
      //
      //     // die type is easy
      //     type_column = str(dietype)
      //
      //     // results need to be joined together with either a comma or plus, depending on the summation mode
      //     result_strings = [str(result) for result in results_by_dietype[dietype]]
      //     result_column = f"({group_join_char.join(result_strings)})"
      //
      //     // everything but the last group gets a +
      //     if dietype != list(results_by_dietype)[-1]:
      //         result_column += " +"
      //
      //     // keep the column the same length by padding the shorter row with spaces
      //     column_width = max(len(type_column), len(result_column))
      //     type_column = type_column.ljust(column_width, " ")
      //     result_column = result_column.ljust(column_width, " ")
      //
      //     type_line += f" {type_column}"
      //     results_line += f" {result_column}"
      //
      // rolls_text = f"```{type_line}\n{results_line}```"
    }

    console.log(content_text)
    console.log(decorative_text)
    console.log(result_text)
    console.log(rolls_text)

    // TODO: content_text needs to get to the bot.say() somehow; either return it alongside the embed or just do the .get("name") out there.
    // embed = discord.Embed(
    //     title=result_text,
    //     description=rolls_text,
    //     color=discord.Color(int("0x511D20", 16)),
    // )  // Mutter the incantation and perform the hex
    // embed.set_author(name=decorative_text)

    // inside a command, event listener, etc.
    const embed = new MessageEmbed()
    	.setColor('#ecbfc2')
    	.setTitle(result_text)
    	.setAuthor({ name: decorative_text }) //, iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
    	.setDescription(rolls_text)
      // .setFooter({ text: roomName })//, iconURL: 'https://i.imgur.com/AfFp7pu.png' });

      // .setURL('https://discord.js.org/')
    	// .setThumbnail('https://i.imgur.com/AfFp7pu.png')
    	// .addFields(
    	// 	{ name: 'Regular field title', value: 'Some value here' },
    	// 	{ name: '\u200B', value: '\u200B' },
    	// 	{ name: 'Inline field title', value: 'Some value here', inline: true },
    	// 	{ name: 'Inline field title', value: 'Some value here', inline: true },
    	// )
    	// .addField('Inline field title', 'Some value here', true)
    	// .setImage('https://i.imgur.com/AfFp7pu.png')
    	// .setTimestamp()

    return embed
  }

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

  console.log('resultsByDieType',resultsByDieType);

  // ~ character name ~
  content_text = rollSnapshot["name"] || "[UNKNOWN]"

  // ~ extra decorative text ~
  decorative_text = ""// "🌺 💀 🌺"

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
  }


  // result_text = `-{{ ${result_text} }}-`

  // ~ what-was-rolled graph ~    (or one-liner if it was a simple roll)
  if (allRolls.length === 1) {
    // rolls_text = `\`\`\`-{{ ${allRolls[0].dieType} }}-\`\`\``
    // rolls_text = `\`\`\`${allRolls[0].dieType}\`\`\``
    result_text = `${result_text}         \`d20\``

  } else {
    // first "column" is five spaces wide, "total" | "  min" | "  max"
    let type_line = "     "
    let mode_text = {"low": "min", "high": "max", "total": "total"}
    let results_line = (mode_text[summary_mode] || '').padEnd(5, " ")

    // the following columns are: die type on top, results grouped below.
    let group_join_char = summary_mode === "total" ? "+" : ","
    Object.keys(resultsByDieType).forEach((dieType,i) => {
      // die type is easy
      let type_column = String(dieType)

      // results need to be joined together with either a comma or plus, depending on the summation mode
      result_strings = resultsByDieType[dieType].map(result => String(result))
      result_column = `(${result_strings.join(group_join_char)})`

      // everything but the last group gets a +
      if (i !== Object.keys(resultsByDieType).length-1) result_column += " +"

      // keep the column the same length by padding the shorter row with spaces
      column_width = Math.max(type_column.length, result_column.length)
      type_column = type_column.padEnd(column_width, " ")
      result_column = result_column.padEnd(column_width, " ")

      type_line += ` ${type_column}`
      results_line += ` ${result_column}`
    });

    rolls_text = `\`\`\`${type_line}\n${results_line}\`\`\``
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
  	.setAuthor({ name: content_text }) //, iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
  	.setDescription(rolls_text)
    .setFooter({ text: `${roomName.substring(0,24)} — ${rollSnapshot["createdAt"]}` })//, iconURL: 'https://i.imgur.com/AfFp7pu.png' });

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

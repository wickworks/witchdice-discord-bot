const { MessageEmbed } = require('discord.js');


const parseRoll = (rollSnapshot, roomName) => {
  console.log('rollSnapshot',rollSnapshot)

  let embed;

  switch (rollSnapshot['type']) {
  case 'dicebag':
    embed = parseDicebag(rollSnapshot, roomName)
    break;
  case 'attack':
    embed = parseAttack(rollSnapshot, roomName)
    break;
  }

  return embed
}


function parseDicebag(rollSnapshot, roomName) {
  let author_name = ""      // goes author name
  let result_text = ""      // goes in embed title
  let rolls_text = ""       // goes in embed description

  let summary_mode = rollSnapshot["conditions"]  // total | high | low
  console.log('summary_mode',summary_mode);

  // extracts the roll objects from the firebase data into just an array
  allRolls = Object.keys(rollSnapshot)
    .filter(eventKey => eventKey.startsWith('roll-'))
    .map(rollKey => rollSnapshot[rollKey])

  // Collect all results by dietype e.g. {'d4':[2,3,3], 'd20':[20]}
  resultsByDieType = {}
  signsByDieType = {}
  allRolls.forEach(roll => {
    const dieType = roll.dieType;
    const result = roll.result;
    if (resultsByDieType[dieType]) {
      resultsByDieType[dieType].push(result)
    } else {
      resultsByDieType[dieType] = [result]
    }
    signsByDieType[dieType] = roll.sign // all die type groups are assumed to have the same sign ("total" doesn't use this)
  })

  console.log('resultsByDieType',resultsByDieType);

  // ~ character name ~
  author_name = rollSnapshot["name"] || "[UNKNOWN]"

  // ~ extra decorative text ~
  // decorative_text = ""// "🌺 💀 🌺"

  // ~ summary // total ~
  if (summary_mode === "high") {
    const high_values = Object.keys(resultsByDieType).map(dieType => Math.max(...resultsByDieType[dieType]) * signsByDieType[dieType])
    const sum = high_values.reduce((a,b) => a+b)
    result_text = String(sum)

  } else if (summary_mode === "low") {
    const low_values = Object.keys(resultsByDieType).map(dieType => Math.min(...resultsByDieType[dieType]) * signsByDieType[dieType])
    const sum = low_values.reduce((a,b) => a+b)
    result_text = String(sum)

  } else { // "total"
    const all_values = allRolls.map(roll => roll.result * roll.sign)
    const sum = all_values.reduce((a,b) => a+b)
    result_text = String(sum)
  }

  result_text = `⦑  ${result_text}  ⦒`

  // ~ what-was-rolled graph ~    (or one-liner if it was a simple roll)
  if (allRolls.length === 1) {
    // rolls_text = `\`\`\`-{{ ${allRolls[0].dieType} }}-\`\`\``
    // rolls_text = `\`\`\`${allRolls[0].dieType}\`\`\``
    result_text = `${result_text}                            \`${allRolls[0].dieType}\``

  } else {
    // first "column" is five spaces wide, "total" | "  min" | "  max"
    let type_line = "     "
    let mode_text = {"low": "min", "high": "max", "total": "total"}
    let results_line = (mode_text[summary_mode] || '').padEnd(5, " ")

    // the following columns are: die type on top, results grouped below.
    let group_join_char = summary_mode === "total" ? "+" : ","
    Object.keys(resultsByDieType).forEach((dieType,i) => {
      let type_column = ''
      let result_column = ''

      // Add a pseudo-column to both type and result with the sign of this group (skip for first group if it's positive)
      if (i > 0 || signsByDieType[dieType] < 0) {
        type_column += '  '
        result_column += `${signsByDieType[dieType] < 0 ? '—' : '+'} `
      }

      // die type is easy
      // type_column += String(resultsByDieType[dieType].length) + String(dieType)
      type_column += String(dieType)

      // results need to be joined together with either a comma or plus, depending on the summation mode
      let result_strings = resultsByDieType[dieType].map(result => String(result))
      result_column += `(${result_strings.join(group_join_char)})`

      // everything but the last group gets a +
      // if (i !== Object.keys(resultsByDieType).length-1) result_column += " +"



      // keep the column the same length by padding the shorter row with spaces
      column_width = Math.max(type_column.length, result_column.length)
      type_column = type_column.padEnd(column_width, " ")
      result_column = result_column.padEnd(column_width, " ")

      type_line += ` ${type_column}`
      results_line += ` ${result_column}`
    });

    rolls_text = `\`\`\`${type_line}\n${results_line}\`\`\``
  }

  // inside a command, event listener, etc.
  const embed = new MessageEmbed()
  	.setColor('#' + getColorFromTime(rollSnapshot["createdAt"]))
    .setAuthor({ name: author_name }) //, iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
  	.setTitle(result_text)
  	.setDescription(rolls_text)
    // .setFooter( getFooterObject(roomName, rollSnapshot) )

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



function parseAttack(rollSnapshot, roomName) {
  let author_name = ""      // goes author name
  let result_text = ""      // goes in embed title
  let rolls_text = ""       // goes in embed description

  const MIN_WIDTH = 36

  author_name = rollSnapshot["char"] || rollSnapshot["name"]
  result_text = rollSnapshot["conditions"]

  // extracts the roll objects from the firebase data into just an array
  allRolls = Object.keys(rollSnapshot)
    .filter(eventKey => eventKey.startsWith('roll-'))
    .map(rollKey => rollSnapshot[rollKey])

  // make the descriptive block of all the attacks in this snapshot
  const skipTotal = !!rollSnapshot["skipTotal"]
  let damageSum = 0

  console.log('skipTotal',skipTotal);
  console.log('rollSnapshot["skipTotal"]',rollSnapshot["skipTotal"]);

  let attackLines = []
  allRolls.forEach(rollData => {
    let name = ''
    let applies = ''
    let attack_roll = ''

    let made_save = false;
    let save_dc = '';

    let damages = {}

    Object.keys(rollData).forEach(rollKey => {
      switch (rollKey) {
        case 'name': name = rollData[rollKey]; break;
        case 'applies': applies = rollData[rollKey]; break;
        case 'attack': attack_roll = rollData[rollKey]; break;
        case 'didsave': made_save = !!rollData[rollKey]; break;
        case 'save': save_dc = rollData[rollKey]; break;
        default: damages[rollKey] = rollData[rollKey]; break;
      }
    });
    let damageTypes = Object.keys(damages)

    let attack_line = ''

    // ATTACKS
    if (attack_roll) {

      // attack_line += `❮ ${String(attack_roll)} ❯ `
      attack_line += `〔 ${String(attack_roll)} 〕`
      if (name) attack_line += `${name.padStart(MIN_WIDTH - attack_line.length - 1, ' ')}`

      attack_line += `\n`

    // SAVES
    } else if (save_dc) {
      if (name) attack_line += name
      attack_line += `${save_dc.padStart(MIN_WIDTH - attack_line.length, ' ')}`

      attack_line += `\n`

      if (made_save) {
        attack_line += 'passed'.padStart(MIN_WIDTH, ' ')
      } else {
        attack_line += 'FAILED'.padStart(MIN_WIDTH, ' ')
      }
    }

    if (damageTypes.length > 0) {
      attack_line += `\n`
      let damage_entries = damageTypes
        .map(damageType => `${damages[damageType]} ${damageType}`)
        .join(', ')
      damage_entries = centerText(damage_entries, '—', MIN_WIDTH)
      attack_line += damage_entries

    } else if (!applies) {
      attack_line += `\n`
      attack_line += centerText('miss', '—', MIN_WIDTH)
    }

    if (applies) {
      let attack_width = attack_line.length
      attack_line += `\n`
      attack_line += ` ∘ ${applies.replaceAll('<br>',`\n ∘ `)}`
    }

    attack_line += `\n`

    attackLines.push(attack_line)

    // sum up the damage
    if (!skipTotal) {
      damageTypes.forEach(damageType => {
        const damage = parseInt(damages[damageType])
        console.log('summing up damage',damages[damageType],' :::', damage);
        if (damage) damageSum += Math.floor(damage)
      });
    }

    console.log(attack_line);
  });

  // assemble the final rolls text
  rolls_text = '```'
  rolls_text += attackLines.join('```\n```')
  rolls_text += '```'

  // do we want to sum up all the damage?
  if (!skipTotal) {
    // bump "advantage", etc to the second line
    rolls_text = result_text + `\n` + rolls_text
    result_text = ''
    // show the damage total
    if (damageSum > 0) result_text = `${damageSum} damage`
  }

  // inside a command, event listener, etc.
  const embed = new MessageEmbed()
  	.setColor('#' + getColorFromTime(rollSnapshot["createdAt"]))
    .setAuthor({ name: author_name }) //, iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
  	.setTitle(result_text)
  	.setDescription(rolls_text)
    // .setFooter( getFooterObject(roomName, rollSnapshot) )

  return embed
}

// ----------------------------------
// ------------ UTILS ---------------
// ----------------------------------

const getColorFromTime = (createdAt) => {
  const createdAtHex = createdAt.toString(16)
  return createdAtHex.substring(createdAtHex.length - 6)
}

function centerText(text, padChar, totalWidth) {
  const SIDE_PADDING = (Math.max(totalWidth-text.length, 2)*.5) - 1

  let returnText = ` ${text} `
  returnText = ''.padEnd(SIDE_PADDING,padChar) + returnText + ''.padStart(SIDE_PADDING,padChar)
  if (text.length % 2 === 1) returnText += padChar
  return returnText
}

// function getFooterObject(roomName, rollSnapshot) {
//   return { text: `${roomName.substring(0,24)} — ${rollSnapshot["createdAt"]}` }
//   //, iconURL: 'https://i.imgur.com/AfFp7pu.png' });
// }


exports.parseRoll = parseRoll
exports.getColorFromTime = getColorFromTime

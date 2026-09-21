require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { status } = require("minecraft-server-util");

const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID,
  WELCOME_CHANNEL_ID,
  MOD_LOG_CHANNEL_ID,
  TICKETS_CHANNEL_ID,
  TICKET_CATEGORY_ID,
  TICKET_SUPPORT_ROLE_ID,
  MINECRAFT_HOST,
  MINECRAFT_PORT
} = process.env;

if (!DISCORD_TOKEN) {
  console.error("❌ Falta DISCORD_TOKEN");
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error("❌ Falta CLIENT_ID");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

const warnings = new Map();

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra todos los comandos disponibles."),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Muestra la latencia del bot."),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Muestra información del servidor de Discord."),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Muestra información de un usuario.")
    .addUserOption(option =>
      option.setName("usuario").setDescription("Usuario").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banea a un usuario.")
    .addUserOption(option =>
      option.setName("usuario").setDescription("Usuario a banear.").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("razon").setDescription("Razón.").setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa a un usuario.")
    .addUserOption(option =>
      option.setName("usuario").setDescription("Usuario a expulsar.").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("razon").setDescription("Razón.").setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Aplica timeout a un usuario.")
    .addUserOption(option =>
      option.setName("usuario").setDescription("Usuario.").setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("minutos")
        .setDescription("Duración en minutos.")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)
    )
    .addStringOption(option =>
      option.setName("razon").setDescription("Razón.").setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Advierte a un usuario.")
    .addUserOption(option =>
      option.setName("usuario").setDescription("Usuario.").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("razon").setDescription("Razón.").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Elimina mensajes.")
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad de mensajes.")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("minecraft")
    .setDescription("Muestra el estado del servidor Minecraft."),

  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Envía el panel de tickets.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
].map(command => command.toJSON());

async function registerCommands() {
  try {
    console.log("🔄 Registrando comandos...");
    const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
      );
      console.log("✅ Comandos registrados en el servidor.");
    } else {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      );
      console.log("✅ Comandos globales registrados.");
    }
  } catch (error) {
    console.error("❌ Error registrando comandos:", error);
  }
}

async function sendLog(guild, title, description) {
  if (!MOD_LOG_CHANNEL_ID) return;

  try {
    const channel = await guild.channels.fetch(MOD_LOG_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0x8a2be2)
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error enviando log:", error);
  }
}

client.once("ready", async () => {
  console.log("====================================");
  console.log("🖤 Oʙsɪᴅɪᴀɴ | Nᴇᴛᴡᴏʀᴋ");
  console.log(`🤖 Bot: ${client.user.tag}`);
  console.log("🟢 Bot conectado correctamente.");
  console.log("====================================");

  client.user.setPresence({
    activities: [{ name: "Oʙsɪᴅɪᴀɴ | Nᴇᴛᴡᴏʀᴋ", type: 3 }],
    status: "online"
  });

  await registerCommands();
});

client.on("guildMemberAdd", async member => {
  if (!WELCOME_CHANNEL_ID) return;

  try {
    const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0x8a2be2)
      .setTitle("🖤 ¡Bienvenido a Oʙsɪᴅɪᴀɴ | Nᴇᴛᴡᴏʀᴋ!")
      .setDescription(
        `¡Hola ${member}! 👋\n\n` +
        "Gracias por unirte a nuestra comunidad.\n" +
        "Lee las reglas y disfruta de **Oʙsɪᴅɪᴀɴ | Nᴇᴛᴡᴏʀᴋ**."
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: "Oʙsɪᴅɪᴀɴ | Nᴇᴛᴡᴏʀᴋ" })
      .setTimestamp();

    await channel.send({ content: `${member}`, embeds: [embed] });
  } catch (error) {
    console.error("❌ Error en bienvenida:", error);
  }
});

client.on("interactionCreate", async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId === "crear_ticket") {
      await interaction.deferReply({ ephemeral: true });

      const guild = interaction.guild;
      const existing = guild.channels.cache.find(
        channel => channel.name === `ticket-${interaction.user.id}`
      );

      if (existing) {
        return interaction.editReply({
          content: `❌ Ya tienes un ticket abierto: ${existing}`
        });
      }

      try {
        const channel = await guild.channels.create({
          name: `ticket-${interaction.user.id}`,
          type: ChannelType.GuildText,
          parent: TICKET_CATEGORY_ID || null,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel]
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
              ]
            },
            ...(TICKET_SUPPORT_ROLE_ID
              ? [{
                  id: TICKET_SUPPORT_ROLE_ID,
                  allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageChannels
                  ]
                }]
              : [])
          ]
        });

        const embed = new EmbedBuilder()
          .setColor(0x8a2be2)
          .setTitle("🎫 Ticket de soporte")
          .setDescription(
            `Hola ${interaction.user} 👋\n\n` +
            "Explica tu problema o consulta y el equipo de soporte te ayudará.\n\n" +
            "🔴 Cuando termines, pulsa **Cerrar Ticket**."
          )
          .setFooter({ text: "Oʙsɪᴅɪᴀɴ | Nᴇᴛᴡᴏʀᴋ" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("cerrar_ticket")
            .setLabel("Cerrar Ticket")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
        );

        await channel.send({
          content: `${interaction.user}${
            TICKET_SUPPORT_ROLE_ID ? ` <@&${TICKET_SUPPORT_ROLE_ID}>` : ""
          }`,
          embeds: [embed],
          components: [row]
        });

        await interaction.editReply({
          content: `✅ Ticket creado correctamente: ${channel}`
        });

        await sendLog(
          guild,
          "🎫 Ticket creado",
          `${interaction.user} creó ${channel}.`
        );
      } catch (error) {
        console.error(error);
        await interaction.editReply({
          content: "❌ No pude crear el ticket. Revisa los permisos del bot."
        });
      }
      return;
    }

    if (interaction.customId === "cerrar_ticket") {
      await interaction.reply({
        content: "🔒 Cerrando ticket en 5 segundos..."
      });

      await sendLog(
        interaction.guild,
        "🔒 Ticket cerrado",
        `${interaction.user} cerró ${interaction.channel}.`
      );

      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch (error) {
          console.error("❌ No se pudo eliminar el ticket:", error);
        }
      }, 5000);

      return;
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "help") {
    const embed = new EmbedBuilder()
      .setColor(0x8a2be2)
      .setTitle("🖤 Oʙsɪᴅɪᴀɴ | Nᴇᴛᴡᴏʀᴋ")
      .setDescription("Lista de comandos disponibles.")
      .addFields(
        {
          name: "📌 Información",
          value: "`/help` `/ping` `/serverinfo` `/userinfo` `/minecraft`"
        },
        {
          name: "🛡️ Moderación",
          value: "`/ban` `/kick` `/timeout` `/warn` `/clear`"
        },
        {
          name: "🎫 Soporte",
          value: "Usa el panel de tickets para contactar con el staff."
        }
      )
      .setFooter({ text: "Oʙsɪᴅɪᴀɴ | Nᴇᴛᴡᴏʀᴋ" });

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "ping") {
    return interaction.reply({
      content: `🏓 Pong!\nLatencia: **${client.ws.ping}ms**`
    });
  }

  if (commandName === "serverinfo") {
    const guild = interaction.guild;

    const embed = new EmbedBuilder()
      .setColor(0x8a2be2)
      .setTitle(`🖤 ${guild.name}`)
      .addFields(
        { name: "👥 Miembros", value: `${guild.memberCount}`, inline: true },
        { name: "🆔 ID", value: guild.id, inline: true },
        { name: "💬 Canales", value: `${guild.channels.cache.size}`, inline: true },
        { name: "👑 Dueño", value: `<@${guild.ownerId}>`, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "userinfo") {
    const user =
      interaction.options.getUser("usuario") || interaction.user;

    const embed = new EmbedBuilder()
      .setColor(0x8a2be2)
      .setTitle(`👤 ${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "🆔 ID", value: user.id },
        {
          name: "📅 Cuenta creada",
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`
        }
      );

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "ban") {
    const user = interaction.options.getUser("usuario");
    const reason =
      interaction.options.getString("razon") || "Sin razón especificada.";

    try {
      await interaction.guild.members.ban(user.id, { reason });

      await interaction.reply({
        content: `🔨 ${user.tag} fue baneado.\n**Razón:** ${reason}`
      });

      await sendLog(
        interaction.guild,
        "🔨 Usuario baneado",
        `**Usuario:** ${user.tag}\n**Moderador:** ${interaction.user}\n**Razón:** ${reason}`
      );
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ No pude banear a ese usuario.",
        ephemeral: true
      });
    }
    return;
  }

  if (commandName === "kick") {
    const user = interaction.options.getUser("usuario");
    const reason =
      interaction.options.getString("razon") || "Sin razón especificada.";

    try {
      const member = await interaction.guild.members.fetch(user.id);
      await member.kick(reason);

      await interaction.reply({
        content: `👢 ${user.tag} fue expulsado.\n**Razón:** ${reason}`
      });

      await sendLog(
        interaction.guild,
        "👢 Usuario expulsado",
        `**Usuario:** ${user.tag}\n**Moderador:** ${interaction.user}\n**Razón:** ${reason}`
      );
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ No pude expulsar a ese usuario.",
        ephemeral: true
      });
    }
    return;
  }

  if (commandName === "timeout") {
    const user = interaction.options.getUser("usuario");
    const minutes = interaction.options.getInteger("minutos");
    const reason =
      interaction.options.getString("razon") || "Sin razón especificada.";

    try {
      const member = await interaction.guild.members.fetch(user.id);
      await member.timeout(minutes * 60 * 1000, reason);

      await interaction.reply({
        content: `⏳ ${user.tag} recibió timeout durante **${minutes} minutos**.`
      });

      await sendLog(
        interaction.guild,
        "⏳ Timeout",
        `**Usuario:** ${user.tag}\n**Moderador:** ${interaction.user}\n**Duración:** ${minutes} minutos\n**Razón:** ${reason}`
      );
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ No pude aplicar el timeout.",
        ephemeral: true
      });
    }
    return;
  }

  if (commandName === "warn") {
    const user = interaction.options.getUser("usuario");
    const reason = interaction.options.getString("razon");

    const userWarnings = warnings.get(user.id) || [];
    userWarnings.push({
      reason,
      moderator: interaction.user.id,
      date: new Date()
    });
    warnings.set(user.id, userWarnings);

    await interaction.reply({
      content:
        `⚠️ ${user.tag} recibió una advertencia.\n` +
        `**Razón:** ${reason}\n` +
        `**Total de advertencias:** ${userWarnings.length}`
    });

    await sendLog(
      interaction.guild,
      "⚠️ Advertencia",
      `**Usuario:** ${user.tag}\n**Moderador:** ${interaction.user}\n**Razón:** ${reason}\n**Total:** ${userWarnings.length}`
    );
    return;
  }

  if (commandName === "clear") {
    const amount = interaction.options.getInteger("cantidad");

    try {
      const messages = await interaction.channel.bulkDelete(amount, true);

      await interaction.reply({
        content: `🧹 Eliminados **${messages.size} mensajes**.`,
        ephemeral: true
      });

      await sendLog(
        interaction.guild,
        "🧹 Mensajes eliminados",
        `${interaction.user} eliminó ${messages.size} mensajes en ${interaction.channel}.`
      );
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ No pude eliminar los mensajes.",
        ephemeral: true
      });
    }
    return;
  }

  if (commandName === "minecraft") {
    if (!MINECRAFT_HOST) {
      return interaction.reply({
        content: "❌ MINECRAFT_HOST no está configurado.",
        ephemeral: true
      });
    }

    await interaction.deferReply();

    try {
      const result = await status(
        MINECRAFT_HOST,
        Number(MINECRAFT_PORT) || 25565,
        { timeout: 5000 }
      );

      const embed = new EmbedBuilder()
        .setColor(0x8a2be2)
        .setTitle("🎮 Estado de Minecraft")
        .addFields(
          { name: "🟢 Estado", value: "ONLINE", inline: true },
          {
            name: "👥 Jugadores",
            value: `${result.players.online}/${result.players.max}`,
            inline: true
          },
          { name: "🌐 IP", value: MINECRAFT_HOST },
          {
            name: "🔌 Puerto",
            value: `${MINECRAFT_PORT || 25565}`,
            inline: true
          },
          {
            name: "⚔️ Versión",
            value: result.version.name || "Desconocida",
            inline: true
          }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("🔴 Servidor Minecraft")
            .setDescription(
              "El servidor parece estar **offline** o no se pudo consultar."
            )
            .addFields({ name: "🌐 IP", value: MINECRAFT_HOST })
            .setTimestamp()
        ]
      });
    }
  }

  if (commandName === "ticketpanel") {
    const embed = new EmbedBuilder()
      .setColor(0x8a2be2)
      .setTitle("🎫 Soporte | Oʙsɪᴅɪᴀɴ")
      .setDescription(
        "¿Necesitas ayuda?\n\n" +
        "Pulsa el botón de abajo para crear un ticket privado con nuestro equipo de soporte."
      )
      .setFooter({ text: "Oʙsɪᴅɪᴀɴ | Nᴇᴛᴡᴏʀᴋ" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("crear_ticket")
        .setLabel("Crear Ticket")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: "✅ Panel de tickets enviado.",
      ephemeral: true
    });
  }
});

client.login(DISCORD_TOKEN);

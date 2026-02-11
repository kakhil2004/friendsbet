require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const DATA_DIR = path.join(__dirname, "..", "data");

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID in env");
  process.exit(1);
}

// ── Data helpers (same JSON files as the Next.js app) ───────────────
function readData(collection) {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeData(collection, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Register slash commands ─────────────────────────────────────────
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("suggest")
      .setDescription("Suggest a new prediction market")
      .addStringOption((opt) =>
        opt.setName("question").setDescription("The yes/no question").setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName("description").setDescription("Optional context").setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName("markets")
      .setDescription("View open markets"),
    new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("View the top players"),
  ];

  const rest = new REST().setToken(TOKEN);
  try {
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands.map((c) => c.toJSON()),
      });
      console.log(`Registered ${commands.length} guild commands`);
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands.map((c) => c.toJSON()),
      });
      console.log(`Registered ${commands.length} global commands`);
    }
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
}

// ── Bot client ──────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

// Track pending suggestions: messageId -> { question, description, userId }
const pendingSuggestions = new Map();

client.once("clientReady", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  registerCommands();
});

// ── Slash command handler ───────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "suggest") {
    const question = interaction.options.getString("question", true);
    const description = interaction.options.getString("description") || "";

    const embed = new EmbedBuilder()
      .setTitle("Market Suggestion")
      .setDescription(question)
      .setColor(0xf59e0b) // amber
      .setFooter({ text: `Suggested by ${interaction.user.displayName}` })
      .setTimestamp();

    if (description) {
      embed.addFields({ name: "Context", value: description });
    }

    embed.addFields({
      name: "Status",
      value: "Waiting for admin approval (react with 👍)",
    });

    const response = await interaction.reply({ embeds: [embed], withResponse: true });
    const reply = response.resource.message;

    pendingSuggestions.set(reply.id, {
      question,
      description,
      userId: interaction.user.id,
      userName: interaction.user.displayName,
    });

    // Add the thumbs up reaction for convenience
    await reply.react("👍");
  }

  if (interaction.commandName === "markets") {
    const markets = readData("markets").filter((m) => m.status === "open");
    if (markets.length === 0) {
      await interaction.reply({ content: "No open markets right now.", ephemeral: true });
      return;
    }

    const bets = readData("bets");
    const embed = new EmbedBuilder()
      .setTitle("Open Markets")
      .setColor(0x3b82f6)
      .setFooter({ text: "FriendBets" });

    for (const market of markets.slice(0, 10)) {
      const marketBets = bets.filter((b) => b.marketId === market.id);
      const yesPool = marketBets.filter((b) => b.outcome === "yes").reduce((s, b) => s + b.amount, 0);
      const noPool = marketBets.filter((b) => b.outcome === "no").reduce((s, b) => s + b.amount, 0);
      const total = yesPool + noPool;
      const yesPct = total > 0 ? Math.round((yesPool / total) * 100) : 50;

      let value = `YES ${yesPct}% | NO ${100 - yesPct}% | Pool: ${total} coins`;
      if (market.closesAt) {
        const ts = Math.floor(new Date(market.closesAt).getTime() / 1000);
        value += ` | Closes <t:${ts}:R>`;
      }
      value += `\n[View Market](${BASE_URL}/market/${market.id})`;

      embed.addFields({ name: market.question, value });
    }

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "leaderboard") {
    const users = readData("users")
      .filter((u) => !u.isAdmin)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    if (users.length === 0) {
      await interaction.reply({ content: "No players yet.", ephemeral: true });
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];
    const lines = users.map(
      (u, i) => `${medals[i] || `**${i + 1}.**`} ${u.displayName} — **${u.balance}** coins`
    );

    const embed = new EmbedBuilder()
      .setTitle("Leaderboard")
      .setDescription(lines.join("\n"))
      .setColor(0xf59e0b)
      .setFooter({ text: "FriendBets" })
      .setURL(`${BASE_URL}/leaderboard`);

    await interaction.reply({ embeds: [embed] });
  }
});

// ── Reaction handler (admin approval) ───────────────────────────────
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.emoji.name !== "👍") return;

  const suggestion = pendingSuggestions.get(reaction.message.id);
  if (!suggestion) return;

  // Check if the reacting user is a server admin/moderator
  const member = await reaction.message.guild?.members.fetch(user.id).catch(() => null);
  if (!member) return;
  const isAdmin = member.permissions.has("ManageGuild") || member.permissions.has("Administrator");
  if (!isAdmin) return;

  // Create the market
  const newMarket = {
    id: generateId(),
    question: suggestion.question,
    description: suggestion.description,
    status: "open",
    resolvedOutcome: null,
    closesAt: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  const markets = readData("markets");
  markets.push(newMarket);
  writeData("markets", markets);

  pendingSuggestions.delete(reaction.message.id);

  // Send confirmation
  const embed = new EmbedBuilder()
    .setTitle(`New Market: ${newMarket.question}`)
    .setColor(0x22c55e) // green
    .setFooter({ text: "FriendBets" })
    .setTimestamp();

  if (newMarket.description) {
    embed.addFields({ name: "Description", value: newMarket.description });
  }
  embed.addFields(
    { name: "Suggested by", value: suggestion.userName, inline: true },
    { name: "Approved by", value: member.displayName, inline: true },
    {
      name: "Place Your Bets",
      value: `[Open Market](${BASE_URL}/market/${newMarket.id})`,
      inline: true,
    }
  );

  const channel = reaction.message.channel;
  await channel.send({ embeds: [embed] });

  // Update the original suggestion embed
  try {
    const origMsg = await channel.messages.fetch(reaction.message.id);
    const updatedEmbed = EmbedBuilder.from(origMsg.embeds[0])
      .spliceFields(-1, 1, { name: "Status", value: "✅ Approved and created!" });
    await origMsg.edit({ embeds: [updatedEmbed] });
  } catch {
    // ignore edit failures
  }
});

// ── Start ───────────────────────────────────────────────────────────
client.login(TOKEN);

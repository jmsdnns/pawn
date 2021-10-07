const Joi = require("@hapi/joi");


// Schema for bot config
const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string()
        .allow("dev", "staging", "prod")
        .required(),

    LOG_LEVEL: Joi.string()
        .allow("error", "warn", "info", "verbose", "debug")
        .default("warn"),

    BOT_TOKEN: Joi.string()
        .required(),

    VOICE_CHANNEL_ID: Joi.string()
        .required(),

    STATUS_CHANNEL_ID: Joi.string(),

    CMD_PREFIX: Joi.string()
        .default("!"),
}).unknown().required();


// Parse environment for Pawn config
const { error, value: envVars } = envVarsSchema.validate(process.env);
if (error) {
    throw new Error(`Config Error: ${error.message}`);
}


// Translate into plain JS object
module.exports = {
    env: envVars.NODE_ENV,
    logging: {
        level: envVars.LOG_LEVEL
    },
    botToken: envVars.BOT_TOKEN,
    voiceChannelID: envVars.VOICE_CHANNEL_ID,
    statusChannelID: envVars.STATUS_CHANNEL_ID,
    cmdPrefix: envVars.CMD_PREFIX
};

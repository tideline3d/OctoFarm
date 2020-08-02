const ServerSettingsDB = require("../models/ServerSettings.js");

const { DotEnv } = require("../systemRunners/system/dotEnvCheck.js");

// Default Settings
const onlinePolling = {
    seconds: 0.5,
};
const timeout = {
    apiTimeout: 1000,
    apiRetryCutoff: 10000,
    apiRetry: 30000,
    webSocketRetry: 5000,
};
const filamentManager = false;

class ServerSettings {
    static async init() {
        const settings = await ServerSettingsDB.find({});
        if (settings.length < 1) {
            const defaultSystemSettings = new ServerSettingsDB({
                onlinePolling,
                timeout,
                filamentManager,
            });
            await defaultSystemSettings.save();
            process.env.ONLINE_POLLING = onlinePolling.seconds;
            process.env.API_TIMEOUT = timeout.apiTimeout;
            process.env.API_TIMEOUT_RETRY = timeout.apiRetryCutoff;
            process.env.API_RECONNECT = timeout.apiRetry;
            process.env.WEBSOCKET_RETRY = timeout.webSocketRetry;
            process.env.FILAMENT_MANAGER = filamentManager;
            return "Server settings have been created...";
        }
        // Server settings exist, but need updating with new ones if they don't exists.
        if (typeof settings[0].timeout === "undefined") {
            settings[0].timeout = timeout;
        }
        if (typeof settings[0].filamentManager === "undefined") {
            settings[0].filamentManager = filamentManager;
        }
        process.env.ONLINE_POLLING = onlinePolling.seconds;
        process.env.API_TIMEOUT = timeout.apiTimeout;
        process.env.API_TIMEOUT_RETRY = timeout.apiRetryCutoff;
        process.env.API_RECONNECT = timeout.apiRetry;
        process.env.WEBSOCKET_RETRY = timeout.webSocketRetry;
        process.env.FILAMENT_MANAGER = filamentManager;

        await settings[0].save();
        return "Server settings already exist, loaded existing values...";
    }

    static update(obj) {
        ServerSettingsDB.find({})
            .then((checked) => {
                const updatedSettings = {
                    appName: process.env.APP_NAME,
                    databaseURI: process.env.DATABASE_URI,
                    serverPort: process.env.SERVER_PORT,
                    requireLogin: process.env.SERVER_REQUIRE_LOGIN,
                    requireRegistration: process.env.SERVER_REQUIRE_REGISTRATION,
                };
                
                if(obj.port !== process.env.SERVER_PORT){
                    process.env.SERVER_PORT = obj.port;
                    updatedSettings.serverPort = obj.port;
                    DotEnv.writeDotEnvFile(updatedSettings);
                }
                if(obj.registration !== process.env.SERVER_REQUIRE_REGISTRATION){
                    process.env.SERVER_REQUIRE_REGISTRATION = obj.registration;
                    updatedSettings.requireLogin = obj.registration;
                    DotEnv.writeDotEnvFile(updatedSettings);
                }
                if(obj.loginRequired !== process.env.SERVER_REQUIRE_LOGIN){
                    process.env.SERVER_REQUIRE_LOGIN = obj.loginRequired;
                    updatedSettings.requireRegistration = obj.loginRequired;
                    DotEnv.writeDotEnvFile(updatedSettings);
                }
                process.env.ONLINE_POLLING = obj.onlinePolling.seconds;
                process.env.API_TIMEOUT = obj.timeout.apiTimeout;
                process.env.API_TIMEOUT_RETRY = obj.timeout.apiRetryCutoff;
                process.env.API_RECONNECT = obj.timeout.apiRetry;
                process.env.WEBSOCKET_RETRY = obj.timeout.webSocketRetry;
                process.env.FILAMENT_MANAGER = obj.filamentManager;
                checked[0] = obj;
                checked[0].save;
            })
            .then((ret) => {
                SettingsClean.start();
            });
    }
}

module.exports = {
    ServerSettings,
};

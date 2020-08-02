const express = require("express");

const router = express.Router();

const Logger = require("../lib/logger.js");

const logger = new Logger("OctoFarm-Server");

let db = {
    MongoURI: "localhost:27017/octofarm"
};

try{
    db = require("../lib/config/db.js");
}catch(e){
    logger.info("Old config.js not found... ignoring", e);
}


const { DotEnv } = require("../systemRunners/system/dotEnvCheck.js");

const startDatabaseSetup = async function(){
    const defaultSettings = {
        db: db.MongoURI,
        appName: "OctoFarm",
        serverPort: 4000,
        requireLogin: true,
        registrationRequired: true,
    };

    router.get('/', (req, res) =>
        res.render('database', {
            page: 'Database Warning',
            defaultSettings: defaultSettings
        })
    );
    router.post("/submitEnvironment", async (req, res, next) => {
        // eslint-disable-next-line prefer-const
        console.log("BODY",req.body);

        let { appName, databaseURI, serverPort, requireLogin, requireRegistration } = req.body;
        const errors = [];

        if(!appName || !databaseURI || !serverPort || !requireLogin || !requireRegistration){
            errors.push({ msg: "Please fill in all fields..." });
        }

        switch (requireLogin) {
        case 'on':
            requireLogin = true;
            break;
        default:
            requireLogin = false;
            break;
        }
        switch (requireRegistration) {
        case 'on':
            requireRegistration = true;
            break;
        default:
            requireRegistration = false;
            break;
        }

        const returnSettings = {
            databaseURI: databaseURI,
            appName: "OctoFarm",
            serverPort: serverPort,
            requireLogin: requireLogin,
            requireRegistration: requireRegistration,
        };


        if (errors.length > 0) {
            res.render("database", {
                page: 'Database Warning',
                defaultSettings: returnSettings,
                errors,
                appName,
                databaseURI,
                serverPort,
                requireLogin,
                requireRegistration,
            });
        }else{
            returnSettings.appName = appName;
            const writeToFile = await DotEnv.writeDotEnvFile(returnSettings);
            if(writeToFile){
                const { SystemCommands } = require("../lib/serverCommands.js");
                res.render("loading", {
                    page: "Loading...",
                    defaultSettings: returnSettings
                });
                setTimeout(() => {
                    SystemCommands.rebootOctoFarm();
                }, 5000);

            }else{
                logger.error("Error writing to file... closing system, please check OctoFarm-Server.log and rectify...");
                process.exit(1);
            }
        }

    });
};


startDatabaseSetup();

module.exports = router;
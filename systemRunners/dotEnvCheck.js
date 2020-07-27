const fs = require('fs');
const Logger = require('../lib/logger.js');

const logger = new Logger('OctoFarm-Server');

const path = './.env';

class DotEnv{
    static async doesDotEnvExist(){
        logger.info("Checking for dotenv file...");
        try{
            await fs.promises.access(path);
            logger.info("dotenv file exists, proceding...");
            return true;
        }catch(e){
            logger.error("dotenv file does not exist: ", e);
            return false;
        }
    }
    static async writeDotEnvFile(actualSettings){

        try{
            const { appName, databaseURI, serverPort, requireLogin, requireRegistration } = actualSettings;
            //Formatting required to generate specific file correctly... do not alter whitespace
            const fileData = `APP_NAME=${appName}
DATABASE_URI=mongodb://${databaseURI}

SERVER_PORT=${serverPort}
SERVER_REQUIRE_LOGIN=${requireLogin}
SERVER_REQUIRE_REGISTRATION=${requireRegistration}`;
            await fs.promises.writeFile(path, fileData);
            logger.info("dotenv file successfully been created: ", fileData);
            return true;
        }catch(e){
            logger.error("Something went wrong trying to save your .env file!", e);
            return false;
        }
    }
    static async validateDotEnv(dotenv){

        const { APP_NAME, DATABASE_URI, SERVER_PORT, SERVER_REQUIRE_LOGIN, SERVER_REQUIRE_REGISTRATION } = dotenv;

        const errors = [];

        if(!DATABASE_URI || !SERVER_PORT || !SERVER_REQUIRE_LOGIN || !SERVER_REQUIRE_REGISTRATION || !APP_NAME){
            errors.push({ msg: "Missing field..." });
        }

        if(isNaN(SERVER_PORT)){
            errors.push({ msg: "Server port isn't a number..." });
        }

        if(!DATABASE_URI.includes("mongodb://")){
            errors.push({ msg: "MongoDB UI isn't formatted..."});
        }

        return errors;
    }

}

module.exports = {
    DotEnv
};


// .env
require('dotenv').config();

//Start up display and version information
const pjson = require('./package.json');
const version = `${pjson.version}.6-RC2`;
process.env.OCTOFARM_VERSION_NUMBER = version;
console.log(`Version: ${version}`);

// Server
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");

// System check tracking
const { ServerChecks } = require("./systemRunners/serverChecks.js");

// Settings
const { DotEnv } = require("./systemRunners/dotEnvCheck.js");
const Logger = require("./lib/logger.js");

const logger = new Logger("OctoFarm-Server");
//const printerClean = require("./lib/dataFunctions/printerClean.js");

//const { PrinterClean } = printerClean;

// Server Port
const app = express();

// Passport Config
require("./config/passport.js")(passport);

// DB Config
const db = require("./config/db.js").MongoURI;

// JSON
app.use(express.json());

// EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

// Bodyparser
app.use(express.urlencoded({ extended: false }));

// Express Session Middleware
app.use(
    session({
        secret: "supersecret",
        resave: true,
        saveUninitialized: true,
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash Middleware
app.use(flash());

// Global Vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
});


const databaseChecks = async function(){
    httpServer();
    logger.info("Initiating Database Checks");
    await logger.info("Checking Server Settings...");
    const { ServerSettings } = require("./settings/serverSettings.js");
    const ss = await ServerSettings.init();
    logger.info(ss);
    const { ClientSettings } = require("./settings/clientSettings.js");
    await logger.info("Checking Client Settings...");
    const cs = await ClientSettings.init();
    await logger.info(cs);
    const { SystemInfo } = require("./systemRunners/systemInformation.js");
    await logger.info("Starting System Information Collection...");
    const si = await SystemInfo.init();
    await logger.info(si);
    const Printers = require('./models/Printer.js');
    const farmPrinters = await Printers.find({}, null, {
        sort: { sortIndex: 1 }
    });
    await logger.info("Grabbed: " + farmPrinters.length + " printers for checking...");
    // const { FarmInformation } = require("./systemRunners/farmInformation.js");
    // const fi = await FarmInformation.init(farmPrinters);
};
const allowClientAccessLoadingScreen = async function(){
    logger.info("Starting up server API");
    app.use("/serverAlive", require("./routes/serverAliveCheck", { page: "route" }));
    // Routes
    //     try {

    //         app.use("/users", require("./routes/users", { page: "route" }));
    //         app.use("/printers", require("./routes/printers", { page: "route" }));
    //         app.use("/settings", require("./routes/settings", { page: "route" }));
    //         // app.use(
    //         //     "/printersInfo",
    //         //     requi("./routes/SSE-printersInfo", { page: "route" })
    //         // );
    //         // app.use(
    //         //     "/dashboardInfo",
    //         //     require("./routes/SSE-dashboard", { page: "route" })
    //         // );
    //         // app.use(
    //         //     "/monitoringInfo",
    //         //     require("./routes/SSE-monitoring", { page: "route" })
    //         // );
    //         app.use("/filament", require("./routes/filament", { page: "route" }));
    //         app.use("/history", require("./routes/history", { page: "route" }));
    //         app.use("/scripts", require("./routes/scripts", { page: "route" }));
    //     } catch (e) {
    //         await logger.error(e);
    //         // eslint-disable-next-line no-console
    //         console.log(e);
    //     }
};

const initiatePrinterChecking = async function(){
    logger.info("Initiating farm printers checking");
};

const initiateBoot = async function(){
    mongoose
        .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => logger.info("Successfully connected to MongoDB database:", process.env.DATABASE_URI))
        .then(() => databaseChecks())
        .then(() => allowClientAccessLoadingScreen())
        .then(() => initiatePrinterChecking())
        .catch((err) => logger.error(err));
};

const httpServer = async function(){
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        logger.info(`HTTP server started...`);
        logger.info(`Please access server on port: ${PORT} and continue the setup...`);
        console.log(`Please access server on port: ${PORT} and continue the setup...`);
    });
    app.use(express.static(`${__dirname}/views`));
};

const setupDatabase = async function(){
    httpServer();
    app.use("/", require("./routes/databaseSetup", {
        page: "route"
    }));

    app.use("/serverAlive", require("./routes/serverAliveCheck", { page: "route" }));
    // Await user input to initiate the dotenv file...
};
// Server startup sequence and checks
const serverInitialisation = async () => {
    app.use(express.static(`${__dirname}/views`));

    const doesDotEnvExist = await DotEnv.doesDotEnvExist();
    if(doesDotEnvExist){
        const verifyEnviroment = await DotEnv.validateDotEnv(process.env);
        if(verifyEnviroment.length <= 0){
            logger.info("Successfully loaded Enviroment Variables... continuing to boot the server...");
            ServerChecks.update("env","success");
            initiateBoot();
        }else{
            logger.error("Error in 'dotenv' file... halting system:", verifyEnviroment);
            process.exit(1);
        }

    }else{
        // Spin up the server on database request screen...
        setupDatabase();
    }
};

serverInitialisation();
// const setupServerSettings = async () => {
//     const serverSettings = require("./settings/serverSettings.js");
//     const { ServerSettings } = serverSettings;
//     await logger.info("Checking Server Settings...");
//     const ss = await ServerSettings.init();
//     // Setup Settings
//     await logger.info(ss);
// };
//
// const serverStart = async () => {
//     try {
//         await logger.info("MongoDB Connected...");
//         // Find server Settings
//         // Initialise farm information
//         const farmInformation = await PrinterClean.initFarmInformation();
//         await logger.info(farmInformation);
//         const settings = await ServerSettingsDB.find({});
//         const clientSettings = require("./settings/clientSettings.js");
//         const { ClientSettings } = clientSettings;
//         await logger.info("Checking Client Settings...");
//         const cs = await ClientSettings.init();
//         await logger.info(cs);
//         const runner = require("./runners/state.js");
//         const { Runner } = runner;
//         const rn = await Runner.init();
//         await logger.info("Printer Runner has been initialised...", rn);
//         const PORT = process.env.PORT || settings[0].server.port;
//         await logger.info("Starting System Information Runner...");
//         const system = require("./runners/systemInformation.js");
//         const { SystemRunner } = system;
//         const sr = await SystemRunner.init();
//         await logger.info(sr);
//         app.listen(PORT, () => {
//             logger.info(`HTTP server started...`);
//             logger.info(`You can now access your server on port: ${PORT}`);
//             // eslint-disable-next-line no-console
//             console.log(`You can now access your server on port: ${PORT}`);
//         });
//     } catch (err) {
//         await logger.error(err);
//     }
//
//
// };
// // Mongo Connect
//

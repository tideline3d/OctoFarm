const _ = require('lodash');

const jobClean = require('./jobClean.js');

const { JobClean } = jobClean;
const fileClean = require('./fileClean.js');

const { FileClean } = fileClean;
const historyClean = require('./historyClean.js');

const { HistoryClean } = historyClean;

const FarmStatistics = require('../../models/FarmStatistics.js');

const currentOperations = {
    operations: [],
    count: {
        printerCount: 0,
        complete: 0,
        offline: 0,
        active: 0,
        idle: 0,
        disconnected: 0,
        farmProgress: 0,
        farmProgressColour: 'danger'
    }
};

const printersInformation = [];

const currentLogs = [];


const printerControlList = [];
let printerFilamentList = [];

let interval = false;

class PrinterClean {
    static removePrintersInformation (index) {
        printersInformation.splice(index, 1);
        if (typeof printersInformation[index] !== 'undefined') {
            printersInformation.splice(index, 1);
        }
        console.log(printersInformation[index]);
    }

    static returnPrintersInformation () {
        return printersInformation;
    }

    static returnPrinterControlList () {
        return printerControlList;
    }

    static returnFilamentList () {
        return printerFilamentList;
    }

    static returnCurrentOperations () {
        return currentOperations;
    }

    static returnDashboardStatistics () {
        return dashboardStatistics;
    }

    static async generate (farmPrinter, filamentManager) {
        try {
            if (typeof farmPrinter.systemChecks !== 'undefined') {
                farmPrinter.systemChecks.cleaning.information.status = 'warning';
            }

            const sortedPrinter = {
                // eslint-disable-next-line no-underscore-dangle
                _id: farmPrinter._id,
                sortIndex: farmPrinter.sortIndex,
                hostState: {
                    state: farmPrinter.hostState,
                    colour: farmPrinter.hostStateColour,
                    desc: farmPrinter.hostDescription
                },
                printerState: {
                    state: farmPrinter.state,
                    colour: farmPrinter.stateColour,
                    desc: farmPrinter.stateDescription
                },
                webSocketState: {
                    colour: farmPrinter.webSocket,
                    desc: farmPrinter.webSocketDescription
                },
                group: farmPrinter.group,
                printerURL: farmPrinter.printerURL,
                cameraURL: farmPrinter.camURL,
                apikey: farmPrinter.apikey,
                octoPrintVersion: farmPrinter.octoPrintVersion,
                flowRate: farmPrinter.flowRate,
                feedRate: farmPrinter.feedRate,
                stepRate: farmPrinter.stepRate,
                systemChecks: farmPrinter.systemChecks,
                currentIdle: farmPrinter.currentIdle,
                currentActive: farmPrinter.currentActive,
                currentOffline: farmPrinter.currentOffline,
                dateAdded: farmPrinter.dateAdded
            };
            sortedPrinter.tools = await PrinterClean.sortTemps(farmPrinter.temps);
            sortedPrinter.currentJob = await JobClean.returnJob(
                farmPrinter.sortIndex
            );
            sortedPrinter.selectedFilament = farmPrinter.selectedFilament;

            sortedPrinter.fileList = await FileClean.returnFiles(
                farmPrinter.sortIndex
            );

            sortedPrinter.currentProfile = await PrinterClean.sortProfile(
                farmPrinter.profiles,
                farmPrinter.current
            );
            sortedPrinter.currentConnection = await PrinterClean.sortConnection(
                farmPrinter.current
            );
            sortedPrinter.connectionOptions = farmPrinter.options;
            sortedPrinter.terminal = await PrinterClean.sortTerminal(
                farmPrinter.sortIndex,
                farmPrinter.logs
            );
            sortedPrinter.costSettings = farmPrinter.costSettings;
            sortedPrinter.powerSettings = farmPrinter.powerSettings;
            sortedPrinter.gcodeScripts = await PrinterClean.sortGCODE(
                farmPrinter.settingsScripts
            );
            sortedPrinter.otherSettings = await PrinterClean.sortOtherSettings(
                farmPrinter.tempTriggers,
                farmPrinter.settingsWebcam,
                farmPrinter.settingsServer
            );
            sortedPrinter.printerName = await PrinterClean.grabPrinterName(
                farmPrinter
            );
            sortedPrinter.storage = farmPrinter.storage;
            const printerIndex = _.findIndex(printerControlList, function (o) {
                return o.printerName == sortedPrinter.printerName;
            });
            if (printerIndex !== -1) {
                printerControlList[printerIndex] = {
                    printerName: sortedPrinter.printerName,
                    printerID: sortedPrinter._id,
                    state: sortedPrinter.printerState.colour
                };
            } else {
                printerControlList.push({
                    printerName: sortedPrinter.printerName,
                    printerID: sortedPrinter._id,
                    state: sortedPrinter.printerState.colour
                });
            }
            if (typeof farmPrinter.systemChecks !== 'undefined') {
                farmPrinter.systemChecks.cleaning.information.status = 'success';
                farmPrinter.systemChecks.cleaning.information.date = new Date();
            }

            printersInformation[farmPrinter.sortIndex] = sortedPrinter;
            PrinterClean.createPrinterList(printersInformation, filamentManager);
        } catch (e) {
            console.log(e);
        }
    }

    static async createPrinterList (farmPrinters, filamentManager) {
        const printerList = ['<option value="0">Not Assigned</option>'];
        farmPrinters.forEach((printer) => {
            if (
                typeof printer.currentProfile !== 'undefined' &&
        printer.currentProfile !== null
            ) {
                for (let i = 0; i < printer.currentProfile.extruder.count; i++) {
                    let listing = null;
                    if (filamentManager) {
                        if (
                            printer.printerState.colour.category === 'Offline' ||
              printer.printerState.colour.category === 'Active'
                        ) {
                            listing = `<option value="${printer._id}-${i}" disabled>${printer.printerName}: Tool ${i}</option>`;
                        } else {
                            listing = `<option value="${printer._id}-${i}">${printer.printerName}: Tool ${i}</option>`;
                        }
                    } else {
                        listing = `<option value="${printer._id}-${i}">${printer.printerName}: Tool ${i}</option>`;
                    }

                    printerList.push(listing);
                }
            }
        });

        printerFilamentList = printerList;
    }

    static sortOtherSettings (temp, webcam, system) {
        const otherSettings = {
            temperatureTriggers: null,
            webCamSettings: null
        };
        if (typeof temp !== 'undefined') {
            otherSettings.temperatureTriggers = temp;
        }
        if (typeof webcam !== 'undefined') {
            otherSettings.webCamSettings = webcam;
        }
        if (typeof system !== 'undefined') {
            otherSettings.system = system;
        }

        return otherSettings;
    }

    static async sortTerminal (i, logs) {
        if (typeof logs !== 'undefined') {
            if (typeof currentLogs[i] === 'undefined') {
                currentLogs[i] = [];
            } else {
                for (let l = 0; l < logs.length; l++) {
                    currentLogs[i].push(logs[l]);
                    if (currentLogs[i].length >= 300) {
                        currentLogs[i].shift();
                    }
                }
            }
        } else {
            currentLogs[i] = [];
        }
        return currentLogs[i];
    }

    static async sortGCODE (settings) {
        if (typeof settings !== 'undefined') {
            return settings.gcode;
        }
        return null;
    }

    static async sortConnection (current) {
        if (typeof current !== 'undefined') {
            return {
                baudrate: current.baudrate,
                port: current.port,
                printerProfile: current.printerProfile
            };
        }
        return null;
    }

    static async sortProfile (profile, current) {
        if (typeof profile !== 'undefined') {
            if (typeof current !== 'undefined') {
                return profile[current.printerProfile];
            }
        } else {
            return null;
        }
    }

    static async sortTemps (temps) {
        if (typeof temps !== 'undefined') {
            return temps;
        }
        return null;
    }

    static grabPrinterName (printer) {
        let name = null;
        if (typeof printer.settingsAppearance !== 'undefined') {
            if (
                printer.settingsAppearance.name === '' ||
        printer.settingsAppearance.name === null
            ) {
                name = printer.printerURL;
            } else {
                name = printer.settingsAppearance.name;
            }
        } else {
            name = printer.printerURL;
        }
        return name;
    }

    static async sortCurrentOperations (farmPrinters) {
        const complete = [];
        const active = [];
        const idle = [];
        const offline = [];
        const disconnected = [];
        const progress = [];
        const operations = [];
        try {
            for (let o = 0; o < farmPrinters.length; o++) {
                const printer = farmPrinters[o];
                if (typeof printer !== 'undefined') {
                    const name = printer.printerName;

                    if (typeof printer.printerState !== 'undefined') {
                        if (printer.printerState.colour.category === 'Idle') {
                            idle.push(printer._id);
                        }
                        if (printer.printerState.colour.category === 'Offline') {
                            offline.push(printer._id);
                        }
                        if (printer.printerState.colour.category === 'Disconnected') {
                            disconnected.push(printer._id);
                        }
                    }

                    if (
                        typeof printer.printerState !== 'undefined' &&
            printer.currentJob != null
                    ) {
                        let id = printer._id;
                        id = id.toString();
                        if (printer.printerState.colour.category === 'Complete') {
                            complete.push(printer._id);
                            progress.push(printer.currentJob.progress);
                            operations.push({
                                index: id,
                                name,
                                progress: Math.floor(printer.currentJob.progress),
                                progressColour: 'success',
                                timeRemaining: printer.currentJob.printTimeRemaining,
                                fileName: printer.currentJob.fileDisplay
                            });
                        }

                        if (
                            printer.printerState.colour.category === 'Active' &&
              typeof printer.currentJob !== 'undefined'
                        ) {
                            active.push(printer._id);
                            progress.push(printer.currentJob.progress);
                            operations.push({
                                index: id,
                                name,
                                progress: Math.floor(printer.currentJob.progress),
                                progressColour: 'warning',
                                timeRemaining: printer.currentJob.printTimeRemaining,
                                fileName: printer.currentJob.fileDisplay
                            });
                        }
                    }
                }
            }

            const actProg = progress.reduce((a, b) => a + b, 0);

            currentOperations.count.farmProgress = Math.floor(
                actProg / progress.length
            );

            if (isNaN(currentOperations.count.farmProgress)) {
                currentOperations.count.farmProgress = 0;
            }
            if (currentOperations.count.farmProgress === 100) {
                currentOperations.count.farmProgressColour = 'success';
            } else {
                currentOperations.count.farmProgressColour = 'warning';
            }
            // 17280

            if (heatMapCounter >= 17280) {
                PrinterClean.heatMapping(
                    currentOperations.count.complete,
                    currentOperations.count.active,
                    currentOperations.count.offline,
                    currentOperations.count.idle,
                    currentOperations.count.disconnected
                );

                heatMapCounter = 0;
            } else {
                heatMapCounter += 1728;
            }

            currentOperations.count.printerCount = farmPrinters.length;
            currentOperations.count.complete = complete.length;
            currentOperations.count.active = active.length;
            currentOperations.count.offline = offline.length;
            currentOperations.count.idle = idle.length;
            currentOperations.count.disconnected = disconnected.length;

            currentOperations.operations = _.orderBy(
                operations,
                ['progress'],
                ['desc']
            );
        } catch (err) {
            console.log(`Current Operations issue: ${err}`);
        }
    }


    // static getDay (value) {
    //     value = value.getDay();
    //     let actualDay = null;
    //     if (value === 1) {
    //         actualDay = 'Monday';
    //     }
    //     if (value === 2) {
    //         actualDay = 'Tuesday';
    //     }
    //     if (value === 3) {
    //         actualDay = 'Wednesday';
    //     }
    //     if (value === 4) {
    //         actualDay = 'Thursday';
    //     }
    //     if (value === 5) {
    //         actualDay = 'Friday';
    //     }
    //     if (value === 6) {
    //         actualDay = 'Saturday';
    //     }
    //     if (value === 0) {
    //         actualDay = 'Sunday';
    //     }
    //     return actualDay;
    // }
    //
    // // eslint-disable-next-line require-jsdoc
    //
    //
    // static getProgressColour (progress) {
    //     progress = parseInt(progress);
    //     if (progress === 0) {
    //         return 'dark';
    //     }
    //     if (progress < 25) {
    //         return 'secondary';
    //     }
    //     if (progress >= 25 && progress <= 50) {
    //         return 'primary';
    //     }
    //     if (progress >= 50 && progress <= 75) {
    //         return 'info';
    //     }
    //     if (progress >= 75 && progress < 100) {
    //         return 'warning';
    //     }
    //     if (progress === 100) {
    //         return 'success';
    //     }
    // }
    //
    // static checkTempRange (state, target, actual, heatingVariation, coolDown) {
    //     if (state === 'Active' || state === 'Idle') {
    //         if (
    //             actual > target - parseInt(heatingVariation) &&
    //     actual < target + parseInt(heatingVariation)
    //         ) {
    //             return 'tempSuccess';
    //         }
    //         return 'tempActive';
    //     }
    //     if (state === 'Complete') {
    //         if (actual > parseInt(coolDown)) {
    //             return 'tempCooling';
    //         }
    //         return 'tempCool';
    //     }
    //     // Offline
    //     return 'tempOffline';
    // }


}
module.exports = {
    PrinterClean
};
if (interval === false) {
    interval = setInterval(() => {
        PrinterClean.sortCurrentOperations(printersInformation);
        PrinterClean.statisticsStart();
    }, 1000);
}
PrinterClean.statisticsStart();

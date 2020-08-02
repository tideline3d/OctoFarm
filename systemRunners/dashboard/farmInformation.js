const FarmStatistics = require("../../models/FarmStatistics.js");

const { Convert } = require("../../lib/converters.js");

let farmStats = null;
let heatMap = [
    {
        name: 'Completed',
        data: []
    },
    {
        name: 'Active',
        data: []
    },
    {
        name: 'Idle',
        data: []
    },
    {
        name: 'Offline',
        data: []
    },
    {
        name: 'Disconnected',
        data: []
    }
];
const arrayTotal = [];
const currentHistoryTemp = [
    {
        name: 'Actual Tool',
        data: []
    },
    {
        name: 'Target Tool',
        data: []
    },
    {
        name: 'Actual Bed',
        data: []
    },
    {
        name: 'Target Bed',
        data: []
    },
    {
        name: 'Actual Chamber',
        data: []
    },
    {
        name: 'Target Chamber',
        data: []
    }
];
const heatMapCounter = 17280;
const dashboardStatistics = {
    currentUtilisation: {},
    currentStatus: {},
    timeEstimates: {},
    farmUtilisation: {},
    printerHeatMaps: {},
    utilisationGraph: {},
    temperatureGraph: {}
};


class FarmInformation{
    static async init (farmPrinters) {
        farmStats = await FarmStatistics.find({});
        if (typeof farmStats === undefined || farmStats.length < 1) {
            const farmStart = new Date();
            const newfarmStats = new FarmStatistics({
                farmStart,
                heatMap
            });
            farmStats[0] = newfarmStats;
            newfarmStats.save();
        } else if (typeof farmStats[0].heatMap === 'undefined') {
            farmStats[0].heatMap = heatMap;
            dashboardStatistics.utilisationGraph = heatMap;
            farmStats[0].markModified('heatMap');
            farmStats[0].save();
        } else {
            heatMap = farmStats[0].heatMap;
            // Make sure array total is updated...
            const today = Convert.convertNumberToDays(new Date());
            for (let i = 0; i < heatMap.length; i++) {
                // If x = today add that fucker up!
                const lastInArray = heatMap[i].data.length - 1;
                console.log(heatMap[i]);
                if (heatMap[i].data[lastInArray].x === today) {
                    if (heatMap[i].name === 'Completed') {
                        arrayTotal[0] = heatMap[i].data[lastInArray].figure;
                    }
                    if (heatMap[i].name === 'Active') {
                        arrayTotal[1] = heatMap[i].data[lastInArray].figure;
                    }
                    if (heatMap[i].name === 'Offline') {
                        arrayTotal[2] = heatMap[i].data[lastInArray].figure;
                    }
                    if (heatMap[i].name === 'Idle') {
                        arrayTotal[3] = heatMap[i].data[lastInArray].figure;
                    }
                    if (heatMap[i].name === 'Disconnected') {
                        arrayTotal[4] = heatMap[i].data[lastInArray].figure;
                    }
                }
            }
        }
        FarmInformation.statisticsStart();
        setInterval(() => {
            //PrinterClean.sortCurrentOperations(printersInformation);
        }, 1000);
        setInterval(() => {
            FarmInformation.statisticsStart();
        }, 5000);
        return 'Farm information inititialised...';
    }
    static async statisticsStart () {
        console.log("STATS");
        const history = HistoryClean.returnStatistics();
        dashboardStatistics.currentUtilisation = [
            {
                data: [
                    currentOperations.count.active,
                    currentOperations.count.complete,
                    currentOperations.count.idle,
                    currentOperations.count.disconnected,
                    currentOperations.count.offline
                ]
            }
        ];

        const farmTotal =
            currentOperations.count.active +
            currentOperations.count.complete +
            currentOperations.count.idle +
            currentOperations.count.disconnected +
            currentOperations.count.offline;
        const activeTotal = currentOperations.count.active;
        const offlineTotal = currentOperations.count.offline;
        const idleTotal =
            currentOperations.count.complete +
            currentOperations.count.idle +
            currentOperations.count.disconnected;
        const activePer = (activeTotal / farmTotal) * 100;
        const idlePer = (idleTotal / farmTotal) * 100;
        const offlinePer = (offlineTotal / farmTotal) * 100;
        dashboardStatistics.currentStatus = [activePer, idlePer, offlinePer];

        const arrayEstimated = [];
        const arrayRemaining = [];
        const arrayElapsed = [];

        const arrayIdle = [];
        const arrayActive = [];
        const arrayOffline = [];
        const heatStatus = [];
        const heatProgress = [];
        const heatTemps = [];
        const heatUtilisation = [];

        const arrayGlobalToolTempActual = [];
        const arrayGlobalToolTempTarget = [];
        const arrayGlobalBedTempActual = [];
        const arrayGlobalBedTempTarget = [];
        const arrayGlobalChamberTempActual = [];
        const arrayGlobalChamberTempTarget = [];
        for (let p = 0; p < printersInformation.length; p++) {
            const printer = printersInformation[p];
            if (typeof printer !== 'undefined') {
                if (typeof printer.currentJob !== 'undefined') {
                    if (printer.currentJob.expectedPrintTime !== null) {
                        arrayEstimated.push(printer.currentJob.expectedPrintTime);
                    }
                    if (printer.currentJob.expectedPrintTime !== null) {
                        arrayRemaining.push(printer.currentJob.printTimeRemaining);
                    }
                    if (printer.currentJob.expectedPrintTime !== null) {
                        arrayElapsed.push(printer.currentJob.printTimeElapsed);
                    }
                }
                arrayIdle.push(printer.currentIdle);
                arrayActive.push(printer.currentActive);
                arrayOffline.push(printer.currentOffline);
                if (typeof printer.printerState !== 'undefined') {
                    const status = printer.printerState.colour.category;
                    let colour = printer.printerState.colour.name;
                    if (printer.printerState.colour.category === 'Offline') {
                        colour = 'offline';
                    }
                    heatStatus.push(
                        `<div title="${printer.printerName}: ${status}" class="bg-${colour} heatMap"></div>`
                    );
                    let tools = null;
                    if (
                        printer.printerState.colour.category === 'Active' ||
                        printer.printerState.colour.category === 'Idle' ||
                        printer.printerState.colour.category === 'Complete'
                    ) {
                        tools = printer.tools;
                    } else {
                        tools = [];
                        tools.push({
                            bed: {
                                actual: 0,
                                target: 0
                            },
                            tool0: {
                                actual: 0,
                                target: 0
                            }
                        });
                    }
                    if (typeof tools !== 'undefined' && tools !== null) {
                        const rightString = [`${printer.printerName}: `];
                        const leftString = [`${printer.printerName}: `];
                        const arrayToolActual = [];
                        const arrayToolTarget = [];
                        const arrayOtherActual = [];
                        const arrayOtherTarget = [];
                        const keys = Object.keys(tools[0]);
                        for (let k = 0; k < keys.length; k++) {
                            if (
                                typeof printer.currentProfile !== 'undefined' &&
                                printer.currentProfile !== null
                            ) {
                                if (
                                    printer.currentProfile.heatedChamber &&
                                    keys[k] === 'chamber'
                                ) {
                                    let actual = '';
                                    let target = '';
                                    if (
                                        printer.tools !== null &&
                                        printer.tools[0][keys[k]].actual !== null
                                    ) {
                                        actual = `Chamber A: ${
                                            printer.tools[0][keys[k]].actual
                                        }°C `;
                                        arrayOtherActual.push(printer.tools[0][keys[k]].actual);
                                        arrayGlobalChamberTempActual.push(
                                            printer.tools[0][keys[k]].actual
                                        );
                                    } else {
                                        actual = `Chamber A: ${0}°C`;
                                    }
                                    if (
                                        printer.tools !== null &&
                                        printer.tools[0][keys[k]].target !== null
                                    ) {
                                        target = `Chamber T: ${
                                            printer.tools[0][keys[k]].target
                                        }°C `;
                                        arrayOtherTarget.push(printer.tools[0][keys[k]].target);
                                        arrayGlobalChamberTempTarget.push(
                                            printer.tools[0][keys[k]].target
                                        );
                                    } else {
                                        target = `Chamber T: ${0}°C`;
                                    }
                                    rightString[2] = `${actual}, ${target}`;
                                }
                                if (
                                    printer.tools !== null &&
                                    printer.currentProfile.heatedBed &&
                                    keys[k] === 'bed'
                                ) {
                                    let actual = '';
                                    let target = '';
                                    if (
                                        printer.tools !== null &&
                                        printer.tools[0][keys[k]].actual !== null
                                    ) {
                                        actual = `Bed A: ${printer.tools[0][keys[k]].actual}°C `;
                                        arrayOtherActual.push(printer.tools[0][keys[k]].actual);
                                        arrayGlobalBedTempActual.push(
                                            printer.tools[0][keys[k]].actual
                                        );
                                    } else {
                                        actual = `Bed A: ${0}°C`;
                                    }
                                    if (
                                        printer.tools !== null &&
                                        printer.tools[0][keys[k]].target !== null
                                    ) {
                                        target = `Bed T: ${printer.tools[0][keys[k]].target}°C `;
                                        arrayOtherTarget.push(printer.tools[0][keys[k]].target);
                                        arrayGlobalBedTempTarget.push(
                                            printer.tools[0][keys[k]].target
                                        );
                                    } else {
                                        target = `Bed T: ${0}°C`;
                                    }
                                    rightString[1] = `${actual}, ${target}`;
                                }
                                if (keys[k].includes('tool')) {
                                    const toolNumber = keys[k].replace('tool', '');
                                    let actual = '';
                                    let target = '';
                                    if (
                                        printer.tools !== null &&
                                        printer.tools[0][keys[k]].actual !== null
                                    ) {
                                        actual = `Tool ${toolNumber} A: ${
                                            printer.tools[0][keys[k]].actual
                                        }°C `;
                                        arrayToolActual.push(printer.tools[0][keys[k]].actual);
                                        arrayGlobalToolTempActual.push(
                                            printer.tools[0][keys[k]].actual
                                        );
                                    } else {
                                        actual = `Tool ${toolNumber} A: 0°C`;
                                    }
                                    if (
                                        printer.tools !== null &&
                                        printer.tools[0][keys[k]].target !== null
                                    ) {
                                        target = `Tool ${toolNumber} T: ${
                                            printer.tools[0][keys[k]].target
                                        }°C `;
                                        arrayToolTarget.push(printer.tools[0][keys[k]].target);
                                        arrayGlobalToolTempTarget.push(
                                            printer.tools[0][keys[k]].target
                                        );
                                    } else {
                                        target = `Tool ${toolNumber} T: 0°C`;
                                    }
                                    leftString[parseInt(toolNumber) + 1] = `${actual}, ${target}`;
                                }
                            } else {
                                leftString[1] = 'Offline';
                                rightString[1] = 'Offline';
                            }
                        }
                        const totalToolActual = arrayToolActual.reduce((a, b) => a + b, 0);
                        const totalToolTarget = arrayToolTarget.reduce((a, b) => a + b, 0);
                        const totalOtherActual = arrayOtherActual.reduce(
                            (a, b) => a + b,
                            0
                        );
                        const totalOtherTarget = arrayToolActual.reduce((a, b) => a + b, 0);
                        let actualString = '<div class="d-flex flex-wrap"><div title="';
                        for (let l = 0; l < leftString.length; l++) {
                            actualString += `${leftString[l]}`;
                        }
                        actualString += `" class="${Convert.convertTemperatureIntoCategory(
                            printer.printerState.colour.category,
                            totalToolTarget,
                            totalToolActual,
                            printer.otherSettings.temperatureTriggers.heatingVariation,
                            printer.otherSettings.temperatureTriggers.coolDown
                        )} heatMapLeft"></div>`;
                        actualString += '<div title="';
                        for (let r = 0; r < rightString.length; r++) {
                            actualString += `${rightString[r]}`;
                        }
                        actualString += `" class="${Convert.convertTemperatureIntoCategory(
                            printer.printerState.colour.category,
                            totalOtherTarget,
                            totalOtherActual,
                            printer.otherSettings.temperatureTriggers.heatingVariation,
                            printer.otherSettings.temperatureTriggers.coolDown
                        )} heatMapLeft"></div></div>`;
                        heatTemps.push(actualString);
                    }
                    let progress = 0;
                    if (
                        typeof printer.currentJob !== 'undefined' &&
                        printer.currentJob.progress !== null
                    ) {
                        progress = printer.currentJob.progress.toFixed(0);
                    }
                    heatProgress.push(
                        `<div title="${
                            printer.printerName
                        }: ${progress}%" class="bg-${Convert.convertProgressToColour(
                            progress
                        )} heatMap"></div>`
                    );
                }
                const printerUptime =
                    printer.currentActive + printer.currentIdle + printer.currentOffline;
                const percentUp = (printer.currentActive / printerUptime) * 100;
                heatUtilisation.push(
                    `<div title="${printer.printerName}: ${percentUp.toFixed(
                        0
                    )}" class="bg-${Convert.convertProgressToColour(
                        percentUp
                    )} heatMap"></div>`
                );
            }
        }
        let timeStamp = new Date();
        timeStamp = timeStamp.getTime();
        const totalGlobalToolTempActual = arrayGlobalToolTempActual.reduce(
            (a, b) => a + b,
            0
        );
        const totalGlobalToolTempTarget = arrayGlobalToolTempTarget.reduce(
            (a, b) => a + b,
            0
        );
        const totalGlobalBedTempActual = arrayGlobalBedTempActual.reduce(
            (a, b) => a + b,
            0
        );
        const totalGlobalBedTempTarget = arrayGlobalBedTempTarget.reduce(
            (a, b) => a + b,
            0
        );
        const totalGlobalChamberTempActual = arrayGlobalChamberTempActual.reduce(
            (a, b) => a + b,
            0
        );
        const totalGlobalChamberTempTarget = arrayGlobalChamberTempTarget.reduce(
            (a, b) => a + b,
            0
        );
        const totalGlobalTemp =
            totalGlobalToolTempActual +
            totalGlobalBedTempActual +
            totalGlobalChamberTempActual;
        currentHistoryTemp[0].data.push({
            x: timeStamp,
            y: totalGlobalToolTempActual
        });
        currentHistoryTemp[1].data.push({
            x: timeStamp,
            y: totalGlobalToolTempTarget
        });
        currentHistoryTemp[2].data.push({
            x: timeStamp,
            y: totalGlobalBedTempActual
        });
        currentHistoryTemp[3].data.push({
            x: timeStamp,
            y: totalGlobalBedTempTarget
        });
        currentHistoryTemp[4].data.push({
            x: timeStamp,
            y: totalGlobalChamberTempActual
        });
        currentHistoryTemp[5].data.push({
            x: timeStamp,
            y: totalGlobalChamberTempTarget
        });
        if (currentHistoryTemp[0].data.length > 720) {
            currentHistoryTemp[0].data.shift();
            currentHistoryTemp[1].data.shift();
            currentHistoryTemp[2].data.shift();
            currentHistoryTemp[3].data.shift();
        }
        dashboardStatistics.temperatureGraph = currentHistoryTemp;
        const totalEstimated = arrayEstimated.reduce((a, b) => a + b, 0);
        const totalRemaining = arrayRemaining.reduce((a, b) => a + b, 0);
        const totalElapsed = arrayElapsed.reduce((a, b) => a + b, 0);
        const averageEstimated = totalEstimated / arrayEstimated.length;
        const averageRemaining = totalRemaining / arrayRemaining.length;
        const averageElapsed = totalElapsed / arrayElapsed.length;
        const cumulativePercent = (totalElapsed / totalEstimated) * 100;
        const cumulativePercentRemaining = 100 - cumulativePercent;
        const averagePercent = (averageElapsed / averageEstimated) * 100;
        const averagePercentRemaining = 100 - averagePercent;
        dashboardStatistics.timeEstimates = {
            totalElapsed,
            totalRemaining,
            totalEstimated,
            averageElapsed,
            averageRemaining,
            averageEstimated,
            cumulativePercent,
            cumulativePercentRemaining,
            averagePercent,
            averagePercentRemaining,
            totalFarmTemp: totalGlobalTemp
        };

        const activeHours = arrayActive.reduce((a, b) => a + b, 0);
        const idleHours = arrayIdle.reduce((a, b) => a + b, 0);
        const offlineHours = arrayOffline.reduce((a, b) => a + b, 0);
        const failedHours = history.currentFailed;
        const totalHours =
            history.currentFailed + activeHours + idleHours + offlineHours;
        const activePercent = (activeHours / totalHours) * 100;
        const offlinePercent = (offlineHours / totalHours) * 100;
        const idlePercent = (idleHours / totalHours) * 100;
        const failedPercent = (failedHours / totalHours) * 100;

        dashboardStatistics.farmUtilisation = {
            activeHours,
            failedHours,
            idleHours,
            offlineHours,
            activeHoursPercent: activePercent,
            failedHoursPercent: failedPercent,
            idleHoursPercent: idlePercent,
            offlineHoursPercent: offlinePercent
        };
        dashboardStatistics.printerHeatMaps = {
            heatStatus,
            heatProgress,
            heatTemps,
            heatUtilisation
        };
    }
}

module.exports = {
    FarmInformation: FarmInformation
};
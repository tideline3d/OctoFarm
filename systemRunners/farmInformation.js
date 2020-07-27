const FarmStatistics = require("../models/FarmStatistics.js");

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

class FarmInformation{
    static async init () {
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
            const today = PrinterClean.getDay(new Date());
            for (let i = 0; i < heatMap.length; i++) {
                // If x = today add that fucker up!
                const lastInArray = heatMap[i].data.length - 1;
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
        return 'Farm information inititialised...';
    }
}

module.exports = {
    FarmInformation: FarmInformation
};
//Support for influx v1.X

const Influx = require('influx');

const host = '192.168.1.5';
const port = '8086';
const database = 'octofarm';
const username = '';
const password = '';

const duration = '365d';
const replication = 1;
const defaultRet = true;

const retentionPolicy = {
    duation: duration,
    replication: replication,
    default: defaultRet
};

let db = null;

async function databaseSetup(){
    db = new Influx.InfluxDB({
        username: username,
        password: password,
        host: host,
        port: port,
        database: database
    });
    // eslint-disable-next-line no-use-before-define
    await checkDatabase();
    // eslint-disable-next-line no-use-before-define
    //await updateRetention();
    return 'Setup';
}
async function checkDatabase(){
    const names = await db.getDatabaseNames();
    if (!names.includes(database)) {
        console.log("Cannot find database... creating new database: "+database);
        await influx.createDatabase(database);
        return 'database created...';
    }else{
        console.log("Database found!");
        return 'database exists... skipping';
    }
}
async function updateRetention(){
    const retention = await db.alterRetentionPolicy(octofarm, {
        duration: retentionPolicy.duation,
        replication: retentionPolicy.replication,
        default: retentionPolicy.default
    });
    return 'BLA';

}
function writePoints(tags, measurement, dataPoints){
    db.writePoints([
        {
            measurement: measurement,
            tags: tags,
            fields: dataPoints,
        }
    ])
        .catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`);
        });
}

module.exports = { databaseSetup, checkDatabase, writePoints };
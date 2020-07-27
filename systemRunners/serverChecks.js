const serverChecks = {
    env: {
        status: "warning",
        date: null
    },
    databaseConnection: {
        status: "warning",
        date: null
    },
    env: {
        status: "warning",
        date: null
    }

};

class ServerChecks{
    static async update(key,value){
        serverChecks[key]["status"] = value;
        serverChecks[key]["date"] = new Date();
    }
    static async returnChecks(){
        return serverChecks;
    }
}

module.exports = {
    ServerChecks
};
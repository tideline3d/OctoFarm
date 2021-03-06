const currentIssues = [];

class PrinterTicker{
    static async addIssue(date, printer, message, state){
        let id = null;
        if(currentIssues.length === 0){
            //first issue
            id = 0;
        }else{
            id = currentIssues[currentIssues.length-1].id + 1;
        }
        const newIssue = {
            id: id,
            date: date,
            message: message,
            printer: printer,
            state: state
        };
        currentIssues.push(newIssue);
        if(currentIssues.length >= 50){
            currentIssues.shift();
        }
    }
    static async removeIssue(id){
        const index = _.findIndex(currentIssues, function(o) { return o.id == id; });
        currentIssues.splice(index, 1);
    }
    static async returnIssue(){
        return currentIssues;
    }
}

module.exports = {
    PrinterTicker
};
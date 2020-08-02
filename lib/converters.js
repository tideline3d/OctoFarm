class Convert{
    static async convertNumberToDays(value){
        value = value.getDay();
        let actualDay = null;
        if (value === 1) {
            actualDay = 'Monday';
        }
        if (value === 2) {
            actualDay = 'Tuesday';
        }
        if (value === 3) {
            actualDay = 'Wednesday';
        }
        if (value === 4) {
            actualDay = 'Thursday';
        }
        if (value === 5) {
            actualDay = 'Friday';
        }
        if (value === 6) {
            actualDay = 'Saturday';
        }
        if (value === 0) {
            actualDay = 'Sunday';
        }
        return actualDay;
    }
    static async convertProgressToColour (progress) {
        progress = parseInt(progress);
        if (progress === 0) {
            return 'dark';
        }
        if (progress < 25) {
            return 'secondary';
        }
        if (progress >= 25 && progress <= 50) {
            return 'primary';
        }
        if (progress >= 50 && progress <= 75) {
            return 'info';
        }
        if (progress >= 75 && progress < 100) {
            return 'warning';
        }
        if (progress === 100) {
            return 'success';
        }
    }

    static async convertTemperatureIntoCategory (state, target, actual, heatingVariation, coolDown) {
        if (state === 'Active' || state === 'Idle') {
            if (
                actual > target - parseInt(heatingVariation) &&
                actual < target + parseInt(heatingVariation)
            ) {
                return 'tempSuccess';
            }
            return 'tempActive';
        }
        if (state === 'Complete') {
            if (actual > parseInt(coolDown)) {
                return 'tempCooling';
            }
            return 'tempCool';
        }
        // Offline
        return 'tempOffline';
    }
}
module.exports = {
    Convert
};